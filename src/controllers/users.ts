
import * as jwt from "jsonwebtoken";
import { User } from "../models/User";

/**
 * Create a new user
 */
export let createUser = async (username: string, password: string) => {
  console.log(username, password);
  // TODO: get username and password from request
  const user = new User({
    username: username,
    password: password,
  });
  console.log("user");
  console.log(user);

  // TODO: encrypt password, check that it doesn't exist

  try {
    const doc = await user.save();
    console.log("doc");
    console.log(doc);
    return { status: 200, response: { success: "User created" } };
  } catch (error) {
    return { status: 500, response: { error: "User creation failed" } };
  }
};

/**
 * Login user and get session key
 */
export let loginUser = async (username: string, password: string) => {
  try {
    const user = await User.findOne({ username: username });

    if (!user) {
      return { status: 500, response: { error: "Authentication failed. User not found." } };
    }

    // FIXME: Encrypt password
    if (user.password !== password) {
      return { status: 500, response: { error: "Authentication failed. Wrong Password." } };
    } else {
      const payload = {
        username: username
      };

      const token = jwt.sign(payload, process.env.SESSION_SECRET, {
        expiresIn: "1d" // expires in 24 hours
      });

      return { status: 200, response: { success: "Login succeeded", token: token } };
    }
  } catch (error) {
    return { status: 500, response: { error: "User creation failed" } };
  }
};
