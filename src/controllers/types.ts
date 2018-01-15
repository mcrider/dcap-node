import * as fs from "fs";
import * as Ajv from "ajv";

import Type from "../models/Type";
import { User } from "../models/User";
import * as storage from "./storage";
import * as encryption from "./encryption";

const typesDir = "./src/config/types/";

interface Link {
  "/": string;
}
interface TypeObject {
  link: Link;
}


/**
 * Load types from local JSON files
 * Validates type schema and creates index hash if needed
 */
export let loadTypes = () => {
  const typeSchemas = new Map();

  const files = fs.readdirSync(typesDir);

  for (const file of files) {
    const data = fs.readFileSync(typesDir + file);
    const schema = JSON.parse(data.toString("utf8"));

    // Validate schema
    if (schema.title !== file.split(".")[0]) {
      throw new SyntaxError("Type config file name must match title attribute");
    }

    // Throw an error if schema is invalid
    const ajv = new Ajv();
    if (!ajv.validateSchema(schema)) {
      throw new SyntaxError(`Type schema "${schema.title}" is an invalid JSON Schema`);
    }

    const type = new Type(schema);
    typeSchemas.set(type.title, type);
  }

  global.dcap.typeSchemas = typeSchemas;

  checkTypeHashes();
};


/**
 * Get type by name (shows index of objects)
 */
export let getType = async (typeName: string, username?: string) => {
  const type = global.dcap.typeSchemas.get(typeName);
  if (type) {
    const response = await storage.getObject(type.hash);

    if (username) {
      // Filter by username
      response.objects = response.objects.filter(filteredObject => filteredObject.username === username);
    }

    response.hash = type.hash;
    return { status: 200, response: response };
  } else {
    return { status: 404, response: { error: "Type not found" } };
  }
};


/**
 * Get type schema from memory
 */
export let getTypeSchema = (typeName: string) => {
  const type = global.dcap.typeSchemas.get(typeName);
  if (type) {
    return { status: 200, response: type.schema };
  } else {
    return { status: 404, response: { error: "Type not found" } };
  }
};


/**
 * Check that all types have associated IPFS hashes, or else create and save them
 */
export let checkTypeHashes = async () => {
  for (const [key, type] of global.dcap.typeSchemas) {
    if (!type.hash) {
      // Save empty array to IPFS to get the type listing's initial hash
      updateTypeIndex(type, { objects: [] });
    }
  }
};


/**
 * Save the typeIndex and save new hash to config file
 */
export let updateTypeIndex = async (type: Type, typeIndex: Object) => {
  const object = await storage.saveObject(typeIndex);
  const hash = object.hash;

  const schema = type.schema;
  schema.hash = hash;

  fs.writeFileSync(typesDir + type.title + ".json", JSON.stringify(schema, undefined, 2));
};


/**
 * Fetch and decrypt object by hash (for encrypted objects)
 */
export let getEncryptedData = async (typeName: string, hash: string, privKey: string, username: string, password: string) => {
  const type = global.dcap.typeSchemas.get(typeName);
  if (!type) {
    return { status: 404, response: { error: "Type not found" } };
  }

  const user = await User.findOne({ username: username });
  if (!user) {
    return { status: 404, response: { error: "User not found" } };
  }

  if (type.schema.encrypted && (!privKey || !password)) {
    return { status: 401, response: { error: "Password and/or private key not included in request body" } };
  } else if (type.schema.encrypted) {
    const data = await storage.getObject(hash);
    const decrypted = await encryption.decrypt(data, user.pub_key, privKey, password);
    return { status: 200, response: decrypted };
  } else {
    const data = await storage.getObject(hash);
  }
};


/**
 * Save an object to IPFS and return its hash
 */
export let saveObject = async (typeName: string, data: any, username: string, privKey?: string, password?: string, hash?: string) => {
  const type = global.dcap.typeSchemas.get(typeName);

  // Check that type in URL exists
  if (!type) {
    return { status: 404, response: { error: `Type "${typeName}" does not exist` } };
  }

  if (!data) {
    return { status: 500, response: { error: "Must supply data object in request body" } };
  }

  if (!username) {
    return { status: 401, response: { error: "Username not supplied" } };
  }

  // Validate against schema
  const ajv = new Ajv();
  const valid = ajv.validate(type.schema, data);
  if (!valid)  {
    return { status: 500, response: { error: ajv.errorsText() } };
  }

  // If object is supposed to be encrypted, do so
  // Fail if private key and password not passed to request
  if (type.schema.encrypted) {
    if (!privKey) {
      return { status: 500, response: { error: "Private key not passed in request body" } };
    }

    if (!password) {
      return { status: 500, response: { error: "Password not passed in request body" } };
    }

    const user = await User.findOne({ username: username });

    data = await encryption.encrypt(data, user.pub_key, privKey, password);
  }

  // Save to IPFS
  const object = await storage.saveObject(data);

  // If not already in there, save to type index
  const typeIndex = await storage.getObject(type.hash);
  let exists = false;
  let hashIndex = -1;
  typeIndex.objects.forEach((typeObject: TypeObject, index: number) => {
    if (typeObject && typeObject.link["/"] == object.hash) {
      exists = true;
    }

    if (hash && typeObject && typeObject.link["/"] == hash) {
      hashIndex = index;
    }
  });

  if (exists) {
    return { status: 500, response: { error: "Object already exists" } };
  } else if (hash) {
      // Replace existing hash
      if (hashIndex < 0) {
        return { status: 404, response: { success: "Object to update not found" } };
      } else if (typeIndex.objects[hashIndex].username !== username) {
        return { status: 403, response: { error: "Invalid username for this object" } };
      } else {
        const created = typeIndex.objects[hashIndex].created;
        typeIndex.objects[hashIndex] = {
          "created": created,
          "updated": Date.now(),
          "username": username,
          "link": {"/": object.hash },
        };
        updateTypeIndex(type, typeIndex);
        return { status: 200, response: { success: "Object updated", hash: object.hash } };
      }
  } else {
    typeIndex.objects.push({
      "created": Date.now(),
      "updated": Date.now(),
      "username": username,
      "link": {"/": object.hash },
    });
    updateTypeIndex(type, typeIndex);
    return { status: 200, response: { success: "Object created", hash: object.hash } };
  }
};


/**
 * Remove an object from a type index (does not delete the actual IPFS doc though)
 */
export let deleteObject = async (typeName: string, hash: string, username: string) => {
  const type = global.dcap.typeSchemas.get(typeName);

  // Check that type in URL exists
  if (!type) {
    return { status: 404, response: { error: `Type "${typeName}" does not exist` } };
  }

  if (!username) {
    return { status: 401, response: { error: "Username not supplied" } };
  }

  const typeIndex = await storage.getObject(type.hash);
  let hashIndex = -1;
  typeIndex.objects.forEach((typeObject: TypeObject, index: number) => {
    if (typeObject && typeObject.link["/"] === hash) {
      hashIndex = index;
    }
  });

  if (hashIndex < 0) {
    return { status: 404, response: { error: "Object to remove not found", hash: hash } };
  } else {
    if (typeIndex.objects[hashIndex].username !== username) {
      return { status: 403, response: { error: "Invalid username for this object" } };
    }

    if (typeIndex.objects.length === 1) {
      typeIndex.objects = [];
    } else {
      delete typeIndex.objects[hashIndex];
    }
    updateTypeIndex(type, typeIndex);
    return { status: 200, response: { success: "Object removed from type index", hash: hash } };
  }
};
