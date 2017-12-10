import * as fs from "fs";
import * as Ajv from "ajv";

import Type from "../models/Type";
import * as storage from "./storage";

const typesDir = "./src/config/types/";

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

export let updateTypeIndex = async (type: Type, typeIndex: Object) => {
  const object = await storage.saveObject(typeIndex);
  const hash = object.hash;

  const schema = type.schema;
  schema.hash = hash;

  fs.writeFileSync(typesDir + type.title + ".json", JSON.stringify(schema, undefined, 2));
};
