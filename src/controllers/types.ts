const fs = require("fs");

import Type from "../models/Type";

/**
 * Load types from local JSON files
 */
export let loadTypes = () => {
  const typesDir = "./src/config/types/";
  const typeSchemas = new Map();

  const files = fs.readdirSync(typesDir);

  for (const file of files) {
    const data = fs.readFileSync(typesDir + file);
    const type = new Type(JSON.parse(data));
    typeSchemas.set(type.name, type);
  }

  global.typeSchemas = typeSchemas;
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

