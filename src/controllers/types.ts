const fs = require("fs");

import Type from "../models/Type";
import * as storage from "./storage";

const typesDir = "./src/config/types/";

/**
 * Load types from local JSON files
 */
export let loadTypes = () => {
  const typeSchemas = new Map();

  const files = fs.readdirSync(typesDir);

  for (const file of files) {
    const data = fs.readFileSync(typesDir + file);
    const type = new Type(JSON.parse(data));
    if (type.name !== file.split(".")[0]) {
      throw new TypeError("Type config file name must match name attribute");
    }

    typeSchemas.set(type.name, type);
  }

  global.typeSchemas = typeSchemas;

  checkTypeHashes();
};

export let saveTypeConfig = () => {
  const typeSchemas = new Map();

  const files = fs.readdirSync(typesDir);

  for (const file of files) {
    const data = fs.readFileSync(typesDir + file);
    const type = new Type(JSON.parse(data));
    if (type.name !== file.split(".")[0]) {
      throw new TypeError("Type config file name must match name attribute");
    }

    typeSchemas.set(type.name, type);
  }

  global.typeSchemas = typeSchemas;

  checkTypeHashes();
};

/**
 * Check that all types have associated IPFS hashes, or else create them
 */
export let checkTypeHashes = async () => {
  for (const [key, type] of global.typeSchemas) {
    if (!type.hash) {
      const object = await storage.saveObject(undefined, type);
      const hash = object.hash;

      // FIXME; save; address; to; file;
    }
  }
};

/**
 * Save type schema to file
 */
export let saveType = (id: string) => {
  // sh = shell.NewShell("localhost:5001")
  // fmt.Println("Saving an object to IPFS")
  // hash, err := sh.Add(r)
  // if err != nil {
  // 	fmt.Println("There was an error saving to IPFS. Please make sure `ipfs daemon` is running")
  // 	log.Fatal(err)
  // }
  // fmt.Println(hash)
  // return hash, err
  return "saveObject";
};

