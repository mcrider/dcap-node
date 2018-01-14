import * as frisby from "frisby";
import { Joi } from "frisby";
import * as dotenv from "dotenv";

import { User } from "../src/models/User";

dotenv.config({ path: ".env" });

const BASE_URL = `http://localhost:${process.env.PORT}`;
const TEST_USERNAME = "testuser";
const TEST_PASSWORD = "abc123";
// TODO: Use mock type schemas (encrypted and unencrypted) instead of test.json
const TEST_TYPE = "test";
const TEST_DATA = { "text": "foobar" };

let privKey;
let token;
let hash;


/**
 * Show API info page
 */
describe("GET /", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .get(`${BASE_URL}/`)
      .expect("status", 200)
      .expect("jsonTypes", {
        message: Joi.string()
      })
      .done(done);
  });
});


/**
 * Create a new user
 */
describe("POST /user/create", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .post(`${BASE_URL}/user/create`, { username: TEST_USERNAME, password: TEST_PASSWORD })
      .expect("status", 200)
      .expect("jsonTypes", {
        success: Joi.string(),
        pub_key: Joi.string(),
        priv_key: Joi.string()
      })
      .then(function (res) {
        privKey = res.json.priv_key;
        return true;
      })
      .done(done);
  });
});


/**
 * Login user
 */
describe("POST /user/login", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .post(`${BASE_URL}/user/login`, { username: TEST_USERNAME, password: TEST_PASSWORD })
      .expect("status", 200)
      .expect("jsonTypes", {
        success: Joi.string(),
        token: Joi.string()
      })
      .then(function (res) {
        token = res.json.token;
        return true;
      })
      .done(done);
  });

  it("should fail with an invalid password", (done) => {
    frisby
      .post(`${BASE_URL}/user/login`, { username: TEST_USERNAME, password: "wrongpass" })
      .expect("status", 403)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });
});


/**
 * Get type by name (shows index of objects)
 */
describe("GET /type/{type}", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .get(`${BASE_URL}/type/${TEST_TYPE}`)
      .expect("status", 200)
      .expect("jsonTypes", {
        objects: Joi.array()
      })
      .done(done);
  });

  it("should return 404 for a nonexistent type", (done) => {
    frisby
      .get(`${BASE_URL}/type/foo`)
      .expect("status", 404)
      .expect("jsonTypes", {
        objects: Joi.array()
      })
      .done(done);
  });
});


/**
 * Get type schema
 */
describe("GET /type/{type}/schema", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .get(`${BASE_URL}/type/${TEST_TYPE}/schema`)
      .expect("status", 200)
      .expect("jsonTypes", {
        objects: Joi.array()
      })
      .done(done);
  });

  it("should return 404 for a nonexistent type", (done) => {
    frisby
      .get(`${BASE_URL}/type/foo/schema`)
      .expect("status", 404)
      .expect("jsonTypes", {
        title: Joi.string(),
        $schema: Joi.string()
      })
      .done(done);
  });
});


/**
 * Add a new object
 */
describe("POST /type/{type}", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .post(`${BASE_URL}/type/${TEST_TYPE}`, {
        data: TEST_DATA,
        password: TEST_PASSWORD,
        priv_key: privKey
      })
      .expect("status", 200)
      .expect("jsonTypes", {
        success: Joi.string(),
        hash: Joi.string()
      })
      .then(function (res) {
        hash = res.json.hash;
        return true;
      })
      .done(done);
  });

  it("should fail without a data object", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .post(`${BASE_URL}/type/${TEST_TYPE}`, { password: TEST_PASSWORD })
      .expect("status", 500)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });

  it("should fail without a login token", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": "wrongtoken" } }})
      .post(`${BASE_URL}/type/${TEST_TYPE}`, { password: TEST_PASSWORD })
      .expect("status", 401)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });

  it("should return 404 for a nonexistent type", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .post(`${BASE_URL}/type/foo`, { data: TEST_DATA, password: TEST_PASSWORD })
      .expect("status", 404)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });
});

/**
 * Get IPFS Object (without handling encryption)
 */
describe("GET /object/{hash}", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .get(`${BASE_URL}/object/${hash}`)
      .expect("status", 200)
      .expect("bodyContains", "BEGIN PGP MESSAGE")
      .done(done);
  });

  it("should return 404 for a nonexistent type", (done) => {
    frisby
      .get(`${BASE_URL}/object/wronghash`)
      .expect("status", 404)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });
});


/**
 * Show object by hash (for encrypted objects)
 */
describe("POST /type/{type}/{hash}", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .post(`${BASE_URL}/type/${TEST_TYPE}/${hash}`, {
        password: TEST_PASSWORD,
        priv_key: privKey
      })
      .expect("status", 200)
      .expect("json", TEST_DATA)
      .done(done);
  });

  it("should fail without a login token", (done) => {
    frisby
      .post(`${BASE_URL}/type/${TEST_TYPE}`, { token: "wrongtoken", password: TEST_PASSWORD })
      .expect("status", 401)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });

  it("should return 404 for a nonexistent type", (done) => {
    frisby
      .post(`${BASE_URL}/type/foo`, { token: token, password: TEST_PASSWORD })
      .expect("status", 404)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });
});


/**
 * Update an existing object
 */
describe("PUT /type/{type}/{hash}", () => {
  it("should only allow users to update their own objects", (done) => {
    frisby
      .post(`${BASE_URL}/user/create`, { username: TEST_USERNAME + "put", password: TEST_PASSWORD })
      .expect("status", 200)
      .then((res) => {
        const putPrivKey = res.json.priv_key;

        return frisby.post(`${BASE_URL}/user/login`, { username: TEST_USERNAME + "put", password: TEST_PASSWORD })
          .expect("status", 200)
          .then((res) => {
            const putToken = res.json.token;

            return frisby.setup({ request: { headers: { "x-access-token": putToken } }})
              .put(`${BASE_URL}/type/${TEST_TYPE}/${hash}`, {
                data: TEST_DATA,
                password: TEST_PASSWORD,
                priv_key: putPrivKey
              })
              .expect("status", 403)
              .expect("jsonTypes", {
                error: Joi.string()
              })
              .then((res) => {
                // Cleanup
                return frisby.setup({ request: { headers: { "x-access-token": putToken } }})
                  .post(`${BASE_URL}/user/delete`, { token: putToken, password: TEST_PASSWORD })
                  .expect("status", 200);
              });
          });
      })
      .done(done);
  });

  it("should return 200 OK with valid response", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .put(`${BASE_URL}/type/${TEST_TYPE}/${hash}`, {
        data: TEST_DATA,
        password: TEST_PASSWORD,
        priv_key: privKey
      })
      .expect("status", 200)
      .expect("jsonTypes", {
        success: Joi.string(),
        hash: Joi.string()
      })
      .then(function (res) {
        hash = res.json.hash;
        return true;
      })
      .done(done);
  });

  it("should fail without a login token", (done) => {
    frisby
      .put(`${BASE_URL}/type/${TEST_TYPE}/${hash}`, { token: "wrongtoken", password: TEST_PASSWORD })
      .expect("status", 401)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });

  it("should return 404 for a nonexistent type", (done) => {
    frisby
      .put(`${BASE_URL}/type/foo/${hash}`, { token: token, password: TEST_PASSWORD })
      .expect("status", 404)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });
});


/**
 * Remove an object from type index
 */
describe("DELETE /type/{type}/{hash}", () => {
  it("should only allow users to delete their own objects", (done) => {
    frisby
      .post(`${BASE_URL}/user/create`, { username: TEST_USERNAME + "del", password: TEST_PASSWORD })
      .expect("status", 200)
      .then((res) => {
        return frisby.post(`${BASE_URL}/user/login`, { username: TEST_USERNAME + "del", password: TEST_PASSWORD })
          .expect("status", 200)
          .then((res) => {
            const delToken = res.json.token;

            return frisby.setup({ request: { headers: { "x-access-token": delToken } }})
              .del(`${BASE_URL}/type/${TEST_TYPE}/${hash}`)
              .expect("status", 403)
              .expect("jsonTypes", {
                error: Joi.string()
              })
              .then((res) => {
                // Cleanup
                return frisby.setup({ request: { headers: { "x-access-token": delToken } }})
                  .post(`${BASE_URL}/user/delete`, { token: delToken, password: TEST_PASSWORD })
                  .expect("status", 200);
              });
          });
      })
      .done(done);
  });

  it("should return 200 OK with valid response", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .del(`${BASE_URL}/type/${TEST_TYPE}/${hash}`)
      .expect("status", 200)
      .expect("jsonTypes", {
        success: Joi.string(),
        hash: Joi.string()
      })
      .done(done);
  });

  it("should fail without a login token", (done) => {
    frisby
      .del(`${BASE_URL}/type/${TEST_TYPE}/${hash}`)
      .expect("status", 401)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });

  it("should return 404 for a nonexistent type", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .del(`${BASE_URL}/type/foo/${hash}`)
      .expect("status", 404)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });

  it("should return 404 for a nonexistent object", (done) => {
    frisby
      .setup({ request: { headers: { "x-access-token": token } }})
      .del(`${BASE_URL}/type/${TEST_TYPE}/wrongobject`)
      .expect("status", 404)
      .expect("jsonTypes", {
        success: Joi.string(),
        hash: Joi.string()
      })
      .done(done);
  });
});


/**
 * Remove own user account
 */
describe("POST /user/delete", () => {
  it("should return 200 OK with valid response", (done) => {
    frisby.post(`${BASE_URL}/user/delete`, { token: token, password: TEST_PASSWORD })
      .expect("status", 200)
      .expect("jsonTypes", {
        success: Joi.string()
      })
      .done(done);
  });

  it("should fail without a login token", (done) => {
    frisby
      .post(`${BASE_URL}/user/delete`, { token: "wrongtoken", password: TEST_PASSWORD })
      .expect("status", 401)
      .expect("jsonTypes", {
        error: Joi.string()
      })
      .done(done);
  });
});
