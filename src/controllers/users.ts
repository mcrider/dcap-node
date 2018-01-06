
import * as jwt from "jsonwebtoken";
import * as openpgp from "openpgp";
import { User } from "../models/User";

/**
 * Create a new user
 */
export let createUser = async (username: string, password: string) => {
  // Generate PGP keypair
  const pgpOptions = {
    userIds: [{ name: username }],
    numBits: process.env.RSA_KEY_SIZE,
    passphrase: password
  };

  let key;
  try {
    key = await openpgp.generateKey(pgpOptions);
  } catch (error) {
    console.log(error);
    return { status: 403, response: { error: `Key creation failed` } };
  }

  const user = new User({
    username: username,
    password: password,
    pub_key: key.publicKeyArmored
  });

  try {
    const doc = await user.save();
    return {
      status: 200,
      response: {
        success: "User created",
        pub_key: key.publicKeyArmored,
        priv_key: key.privateKeyArmored
      }
    };
  } catch (error) {
    const message = error.code == 11000 ? ": Username already exists" : "";
    return { status: 403, response: { error: `User creation failed${message}` } };
  }
};

/**
 * Login user and get session key
 */
export let loginUser = async (username: string, password: string) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return { status: 403, response: { error: "Authentication failed. User not found." } };
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return { status: 403, response: { error: "Authentication failed. Wrong Password." } };
    }

    const payload = {
      username: username
    };

    const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: process.env.SESSION_EXPIRY
    });

    return { status: 200, response: { success: "Login succeeded", token: token } };
  } catch (error) {
    return { status: 403, response: { error: "User login failed" } };
  }
};
