
import * as jwt from "jsonwebtoken";
import * as encryption from "./encryption";
import { User } from "../models/User";

/**
 * Create a new user
 */
export let createUser = async (username: string, password: string) => {
  // Generate PGP keypair
  const key = await encryption.generateKeypair(username, password);
  if (!key) {
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

/**
 * Remove own user account
 */
export let deleteUser = async (password: string, username: string) => {
  if (!password) {
    return { status: 401, response: { error: "Password must be supplied" } };
  }

  if (!username) {
    return { status: 401, response: { error: "Username not supplied" } };
  }

  const user = await User.findOne({ username: username });

  const valid = await user.comparePassword(password);
  if (!valid) {
    return { status: 401, response: { error: "Authentication failed. Wrong Password." } };
  }

  try {
    user.remove();
    return { status: 200, response: { success: "User successfully deleted" } };
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
