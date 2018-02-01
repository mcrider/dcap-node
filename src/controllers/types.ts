import * as fs from "fs";
import * as Ajv from "ajv";

import Type from "../models/Type";
import User from "../models/User/index";
import * as storage from "./storage";
import * as encryption from "./encryption";

const typesDir = "./src/config/types/";

interface Link {
  "/": string;
}
interface TypeDocument {
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
 * Get type by name (shows index of documents)
 */
export let getType = async (typeName: string, username?: string) => {
  const type = global.dcap.typeSchemas.get(typeName);
  if (type) {
    const response = await storage.getDocument(type.hash);

    if (username) {
      // Filter by username
      response.documents = response.documents.filter(filteredDocument => filteredDocument ? (filteredDocument.username === username) : false);
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
      updateTypeIndex(type, { documents: [] });
    }
  }
};


/**
 * Save the typeIndex and save new hash to config file
 */
export let updateTypeIndex = async (type: Type, typeIndex: Object) => {
  const document = await storage.saveDocument(typeIndex);

  const hash = document.hash;

  const schema = type.schema;
  schema.hash = hash;

  try {
    fs.writeFileSync(typesDir + type.title + ".json", JSON.stringify(schema, undefined, 2));
  } catch (err) {
    console.error(err);
  }
};


/**
 * Fetch and decrypt document by hash (for encrypted documents)
 */
export let getEncryptedData = async (typeName: string, hash: string, privKey: string, username: string, password: string) => {
  const type = global.dcap.typeSchemas.get(typeName);
  if (!type) {
    return { status: 404, response: { error: "Type not found" } };
  }

  const user = new User(username, password);
  const userData = await user.fetch();
  if (!userData) {
    return { status: 404, response: { error: "User not found" } };
  }

  if (type.schema.encrypted && (!privKey || !password)) {
    return { status: 401, response: { error: "Password and/or private key not included in request body" } };
  } else if (type.schema.encrypted) {
    const data = await storage.getDocument(hash);
    const decrypted = await encryption.decrypt(data, userData.pub_key, privKey, password);
    return { status: 200, response: decrypted };
  } else {
    const data = await storage.getDocument(hash);
  }
};


/**
 * Save an document to IPFS and return its hash
 */
export let saveDocument = async (typeName: string, data: any, username: string, privKey?: string, password?: string, hash?: string) => {
  const type = global.dcap.typeSchemas.get(typeName);

  // Check that type in URL exists
  if (!type) {
    return { status: 404, response: { error: `Type "${typeName}" does not exist` } };
  }

  if (!data) {
    return { status: 500, response: { error: "Must supply data in request body" } };
  }

  if (!username) {
    return { status: 401, response: { error: "Username not found in token" } };
  }

  // Validate against schema
  const ajv = new Ajv();
  const valid = ajv.validate(type.schema, data);
  if (!valid)  {
    return { status: 500, response: { error: ajv.errorsText() } };
  }

  // If document is supposed to be encrypted, do so
  // Fail if private key and password not passed to request
  let documentData = data;
  if (type.schema.encrypted) {
    if (!privKey) {
      return { status: 500, response: { error: "Private key not passed in request body" } };
    }

    if (!password) {
      return { status: 500, response: { error: "Password not passed in request body" } };
    }

    let userData;
    try {
      const user = new User(username, password);
      userData = await user.fetch();
    } catch (error) {
      console.error(error);
      return { status: 500, response: { error: "Error getting user data" } };
    }

    documentData = await encryption.encrypt(data, userData.pub_key ? userData.pub_key : false, privKey, password);
  }

  // Save to IPFS
  const document = await storage.saveDocument(documentData);

  // If not already in there, save to type index
  const typeIndex = await storage.getDocument(type.hash);
  let exists = false;
  let hashIndex = -1;
  typeIndex.documents.forEach((typeDocument: TypeDocument, index: number) => {
    if (typeDocument && typeDocument.link["/"] == document.hash) {
      exists = true;
    }

    if (hash && typeDocument && typeDocument.link["/"] == hash) {
      hashIndex = index;
    }
  });

  if (exists) {
    return { status: 500, response: { error: "Document already exists" } };
  } else if (hash) {
    // Replace existing hash
    if (hashIndex < 0) {
      return { status: 404, response: { success: "Document to update not found" } };
    } else if (typeIndex.documents[hashIndex].username !== username) {
      return { status: 403, response: { error: "Invalid username for this document" } };
    } else {
      const created = typeIndex.documents[hashIndex].created;
      const indexItem = {
        "created": created,
        "updated": Date.now(),
        "username": username,
        "link": {"/": document.hash },
      };
      // Add public items to index
      if (type.schema.public) {
        type.schema.public.forEach((item) => {
          indexItem[item] = data[item];
        });
      }
      typeIndex.documents[hashIndex] = indexItem;
      updateTypeIndex(type, typeIndex);
      return { status: 200, response: { success: "Document updated", hash: document.hash } };
    }
  } else {
    const indexItem = {
      "created": Date.now(),
      "updated": Date.now(),
      "username": username,
      "link": {"/": document.hash },
    };
    // Add public items to index
    if (type.schema.public) {
      type.schema.public.forEach((item) => {
        indexItem[item] = data[item];
      });
    }
    typeIndex.documents.push(indexItem);
    updateTypeIndex(type, typeIndex);
    return { status: 200, response: { success: "Document created", hash: document.hash } };
  }
};


/**
 * Remove an document from a type index (does not delete the actual IPFS doc though)
 */
export let deleteDocument = async (typeName: string, hash: string, username: string) => {
  const type = global.dcap.typeSchemas.get(typeName);

  // Check that type in URL exists
  if (!type) {
    return { status: 404, response: { error: `Type "${typeName}" does not exist` } };
  }

  if (!username) {
    return { status: 401, response: { error: "Username not found in token" } };
  }

  const typeIndex = await storage.getDocument(type.hash);
  let hashIndex = -1;
  typeIndex.documents.forEach((typeDocument: TypeDocument, index: number) => {
    if (typeDocument && typeDocument.link["/"] === hash) {
      hashIndex = index;
    }
  });

  if (hashIndex < 0) {
    return { status: 404, response: { error: "Document to remove not found", hash: hash } };
  } else {
    if (typeIndex.documents[hashIndex].username !== username) {
      return { status: 403, response: { error: "Invalid username for this document" } };
    }
    typeIndex.documents.splice(hashIndex, 1);
    updateTypeIndex(type, typeIndex);
    return { status: 200, response: { success: "Document removed from type index", hash: hash } };
  }
};
