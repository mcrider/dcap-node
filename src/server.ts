/**
 * Module dependencies.
 */
import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as logger from "morgan";
import * as errorHandler from "errorhandler";
import * as lusca from "lusca";
import * as dotenv from "dotenv";
import * as flash from "express-flash";
import * as path from "path";
import expressValidator = require("express-validator");


/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env" });


/**
 * Controllers
 */
import * as apiController from "./controllers/api";
import * as types from "./controllers/types";


/**
 * Load global config
 */
global.dcap = {};
types.loadTypes();


/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(cors());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));

/**
 * API  routes.
 */
app.get("/", apiController.getRoot);
app.post("/user/create", apiController.createUser);
app.post("/user/login", apiController.loginUser);
app.post("/user/delete", apiController.validateToken, apiController.deleteUser);
app.get("/type/:type", apiController.getType);
app.get("/type/:type/schema", apiController.getTypeSchema);
app.post("/type/:type", apiController.validateToken, apiController.addDocument);
app.post("/type/:type/:hash", apiController.validateToken, apiController.getTypeDocument);
app.put("/type/:type/:hash", apiController.validateToken, apiController.updateDocument);
app.delete("/type/:type/:hash", apiController.validateToken, apiController.deleteDocument);
app.get("/document/:hash", apiController.getDocument);

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());
process.on("unhandledRejection", r => console.log(r));


/**
 * Start Express server.
 */
app.listen(app.get("port"), () => {
  console.log("--------------------------------------------------------------");
  console.log(("|  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("|  Press CTRL-C to stop");
  console.log("--------------------------------------------------------------\n");
});

module.exports = app;
