
import * as jwt from "jsonwebtoken";
import * as encryption from "./encryption";
import User from "../models/User/index";


/**
 * Create a new user
 */
export let createUser = async (username: string, password: string) => {
  // Generate PGP keypair
  const key = await encryption.generateKeypair(username, password);
  if (!key) {
    return { status: 500, response: { error: "Key creation failed" } };
  }

  try {
    const user = new User(username, password);
    const userData = await user.create(key.publicKeyArmored);
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
    return { status: 500, response: { error: `User creation failed${message}` } };
  }
};

/**
 * Login user and get session key
 */
export let loginUser = async (username: string, password: string) => {
  try {
    const user = new User(username, password);

    const userData = await user.fetch();
    if (!user.fetch()) {
      return { status: 401, response: { error: "Authentication failed. User not found." } };
    }

    const valid = await user.checkPassword();
    if (!valid) {
      return { status: 401, response: { error: "Authentication failed. Wrong Password." } };
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

/**
 * Remove own user account
 */
export let deleteUser = async (username: string, password: string) => {
  if (!password) {
    return { status: 401, response: { error: "Password must be supplied" } };
  }

  if (!username) {
    return { status: 401, response: { error: "Username not found in token" } };
  }

  try {
    const user = new User(username, password);

    const userData = await user.fetch();
    if (!user.fetch()) {
      return { status: 401, response: { error: "Authentication failed. User not found." } };
    }

    const valid = await user.checkPassword();
    if (!valid) {
      return { status: 401, response: { error: "Authentication failed. Wrong Password." } };
    }

    const deleted = await user.delete();
    if (!deleted) {
      return { status: 403, response: { error: "User deletion failed" } };
    } else {
      return { status: 200, response: { success: "User successfully deleted" } };
    }
  } catch (error) {
    return { status: 403, response: { error: "User deletion failed" } };
  }
};

/**
 * Validate request token
 */
export let validateToken = async (token: string) => {
  if (!token) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    return decoded;
  } catch (err) {
    return false;
  }
};
