import * as openpgp from "openpgp";

/**
 * PGP-encrypt content
 */
export let encrypt = async (data: string, pubKey: string, privKey: string, password: string) => {
  const privKeyObj = openpgp.key.readArmored(privKey).keys[0];
  privKeyObj.decrypt(password);

  const pgpOptions = {
    data: JSON.stringify(data), // input as String (or Uint8Array)
    publicKeys: openpgp.key.readArmored(pubKey).keys,  // for encryption
    privateKeys: privKeyObj // for signing (optional)
  };

  try {
    const encrypted = await openpgp.encrypt(pgpOptions);
    return encrypted.data;
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * PGP-decrypt content
 */
export let decrypt = async (data: string, pubKey: string, privKey: string, password: string) => {
  const privKeyObj = openpgp.key.readArmored(privKey).keys[0];
  privKeyObj.decrypt(password);

  const pgpOptions = {
    message: openpgp.message.readArmored(data), // parse armored message
    publicKeys: openpgp.key.readArmored(pubKey).keys, // for verification (optional)
    privateKey: privKeyObj // for decryption
  };

  // let decrypted;
  try {
    const decrypted = await openpgp.decrypt(pgpOptions);
    return JSON.parse(decrypted.data);
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Generate a PGP keypair
 */
export let generateKeypair = async (username: string, password: string) => {
  const pgpOptions = {
    userIds: [{ name: username }],
    numBits: process.env.RSA_KEY_SIZE,
    passphrase: password
  };

  let key;
  try {
    key = await openpgp.generateKey(pgpOptions);
    return key;
  } catch (error) {
    console.error(error);
    return false;
  }
};
