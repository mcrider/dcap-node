import * as fs from "fs";
import * as bcrypt from "bcrypt";

import * as storage from "../../../controllers/storage";
import * as types from "../../../controllers/types";
import * as encryption from "../../../controllers/encryption";

const configDir = "./src/config/";

const getServerKeypair = async () => {
  // TODO: Get from disk, or else generate and save to disk
  let publicKey;
  try {
    publicKey = fs.readFileSync(`${configDir}/public.key`, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      publicKey = false;
    } else {
      throw err;
    }
  }

  let privateKey;
  try {
    privateKey = fs.readFileSync(`${configDir}/private.key`, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      privateKey = false;
    } else {
      throw err;
    }
  }

  if (!publicKey || !privateKey) {
    const key = await encryption.generateKeypair("dcap", process.env.SERVER_KEY_PASS);
    publicKey = key.publicKeyArmored;
    privateKey = key.privateKeyArmored;
    fs.writeFileSync(`${configDir}/public.key`, publicKey);
    fs.writeFileSync(`${configDir}/private.key`, privateKey);
  }

  return { pubKey: publicKey, privKey: privateKey, password: process.env.SERVER_KEY_PASS };
};

export let createUser = async (username: string, password: string, pubKey: string) => {
  const serverKeypair = await getServerKeypair();

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  const userData = { username, password: hash, pub_key: pubKey };

  const type = global.dcap.typeSchemas.get("user");
  if (!type) {
    return false;
  }

  const data = await encryption.encrypt(JSON.stringify(userData), serverKeypair.pubKey, serverKeypair.privKey, serverKeypair.password);

  // Save to IPFS
  const document = await storage.saveDocument(data);

  // Update type index with new user
  const typeIndex = await storage.getDocument(type.hash);
  typeIndex.documents.push({
    "created": Date.now(),
    "updated": Date.now(),
    "username": username,
    "link": {"/": document.hash },
  });
  types.updateTypeIndex(type, typeIndex);
  return true;
};

export let fetchUser = async (username: string) => {
  const index = await types.getType("user", username);
  if (!index.response.documents.length) {
    return false;
  }
  const document = index.response.documents[0];

  const data = await storage.getDocument(document.link["/"]);

  const serverKeypair = await getServerKeypair();
  const decrypted = await encryption.decrypt(data, serverKeypair.pubKey, serverKeypair.privKey, serverKeypair.password);

  return JSON.parse(decrypted);
};

export let checkPassword = async (username, password: string) => {
  const user = await fetchUser(username);

  let isValid;
  try {
    isValid = await bcrypt.compare(password, user.password);
  } catch (err) {
    console.error(err);
    return false;
  }
  return isValid;
};

export let deleteUser = async (username: string) => {
  const index = await types.getType("user", username);
  const document = index.response.documents[0];
  if (!document) {
    return false;
  }

  const data = await storage.getDocument(document.link["/"]);
  const result = await types.deleteDocument("user", document.link["/"], username);
  return result.status === 200;
};

