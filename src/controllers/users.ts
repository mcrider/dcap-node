
import * as jwt from "jsonwebtoken";
import { User } from "../models/User";

/**
 * Create a new user
 */
export let createUser = async (username: string, password: string) => {
  const user = new User({
    username: username,
    password: password,
  });

  try {
    const doc = await user.save();
    return { status: 200, response: { success: "User created" } };
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
