import * as MongoUser from "./mongo/index";
import * as IpfsUser from "./ipfs/index";

/**
 * This is a proxy class to various user storage implementations
 */
export default class User {
  private _username: string;
  private _password: string;
  private _userHandler: any;

  constructor(username: string, password: string) {
    this._username = username;
    this._password = password;

    // TODO set based on env config
    if (process.env.USER_STORAGE === "mongo") {
      this._userHandler = MongoUser;
    } else {
      this._userHandler = IpfsUser;
    }
  }

  /**
   * Fetch all stored user data
   */
  async fetch() {
    if (!this._userHandler.fetchUser) {
      console.error("fetchUser not implemented in child");
    }

    return this._userHandler.fetchUser.apply(undefined, [this._username]);
  }

  /**
   * Create new user record
   */
  async create(pubKey: string) {
    if (!this._userHandler.createUser) {
      throw new Error("createUser not implemented in child");
    }

    return this._userHandler.createUser.apply(undefined, [this._username, this._password, pubKey]);
  }

  /**
   * Validate password against user record
   */
  async checkPassword() {
    if (!this._userHandler.checkPassword) {
      console.error("checkPassword not implemented in child");
    }

    return this._userHandler.checkPassword.apply(undefined, [this._username, this._password]);
  }

  /**
   * Delete user record
   */
  async delete() {
    if (!this._userHandler.deleteUser) {
      console.error("deleteUser not implemented in child");
    }

    return this._userHandler.deleteUser.apply(undefined, [this._username, this._password]);
  }
}
