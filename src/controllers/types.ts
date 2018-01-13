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

interface TypePayload {
  data: any;
  priv_key: string;
  password: string;
  username: string;
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
export let getType = async (typeName: string) => {
  const type = global.dcap.typeSchemas.get(typeName);
  if (type) {
    const response = await storage.getObject(type.hash);
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
export let saveObject = async (typeName: string, body: TypePayload, hash?: string) => {
  const type = global.dcap.typeSchemas.get(typeName);

  // Check that type in URL exists
  if (!type) {
    return { status: 404, response: { error: `Type "${typeName}" does not exist` } };
  }

  // Validate against schema
  const ajv = new Ajv();
  const valid = ajv.validate(type.schema, body.data);
  if (!valid)  {
    return { status: 500, response: { error: ajv.errorsText() } };
  }

  // If object is supposed to be encrypted, do so
  // Fail if private key and password not passed to request
  if (type.schema.encrypted) {
    if (!body.priv_key) {
      return { status: 500, response: { error: "Private key not passed in request body" } };
    }

    if (!body.password) {
      return { status: 500, response: { error: "Password not passed in request body" } };
    }

    if (!body.username) {
      return { status: 500, response: { error: "JWT token not valid" } };
    }

    const user = await User.findOne({ username: body.username });

    body = await encryption.encrypt(body.data, user.pub_key, body.priv_key, body.password);
    console.log(body);
  }

  // Save to IPFS
  const object = await storage.saveObject(body);

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
    return { status: 500, response: { error: "Object already exists", hash: object.hash } };
  } else if (hash) {
      // Replace existing hash
      if (hashIndex < 0) {
        return { status: 404, response: { success: "Object to update not found", hash: object.hash } };
      } else {
        typeIndex.objects[hashIndex] = {
          "link": {"/": object.hash },
        };
        updateTypeIndex(type, typeIndex);
        return { status: 200, response: { success: "Object updated", hash: object.hash } };
      }
  } else {
    typeIndex.objects.push({
      "link": {"/": object.hash },
    });
    updateTypeIndex(type, typeIndex);
    return { status: 200, response: { success: "Object created", hash: object.hash } };
  }
};


/**
 * Remove an object from a type index (does not delete object)
 */
export let removeObject = async (typeName: string, hash: string) => {
  const type = global.dcap.typeSchemas.get(typeName);

  // Check that type in URL exists
  if (!type) {
    return { status: 404, response: { error: `Type "${typeName}" does not exist` } };
  }

  // TODO: Object username must match user's username

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
    if (typeIndex.objects.length === 1) {
      typeIndex.objects = [];
    } else {
      delete typeIndex.objects[hashIndex];
    }
    updateTypeIndex(type, typeIndex);
    return { status: 200, response: { success: "Object removed from typeIndex", hash: hash } };
  }
};
