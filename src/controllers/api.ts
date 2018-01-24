import { Response, Request, NextFunction } from "express";
import * as Ajv from "ajv";
import * as jwt from "jsonwebtoken";

import * as storage from "./storage";
import * as types from "./types";
import * as users from "./users";

/**
 * GET /
 * Show API info page
 */
export let getRoot = (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to dcap! Please visit https://github.com/mcrider/dcap-node for more information."
  });
};

/**
 * GET /type/{type}
 * Get type by name (shows index of documents)
 */
export let getType = async (req: Request, res: Response) => {
  const user = req.query.user || req.query.username || false;
  const { status, response } = await types.getType(req.params.type, user);
  res.status(status).json(response);
};

/**
 * GET /type/{type}/schema
 * Get type schema
 */
export let getTypeSchema = (req: Request, res: Response) => {
  const { status, response } = types.getTypeSchema(req.params.type);
  res.status(status).json(response);
};

/**
 * GET /document/{hash}
 * Show document by hash
 */
export let getDocument = async (req: Request, res: Response) => {
  const data = await storage.getDocument(req.params.hash);
  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404).json({ error: "IPFS document not found or innaccessible"});
  }
};

/**
 * POST /type/{type}/{hash}
 * Show document by hash (for encrypted documents)
 */
export let getTypeDocument = async (req: Request, res: Response) => {
  const { status, response } = await types.getEncryptedData(req.params.type, req.params.hash, req.body.priv_key, req.body.username, req.body.password);
  res.status(status).json(response);
};

/**
 * POST /type/{type}
 * Add a new document
 */
export let addDocument = async (req: Request, res: Response) => {
  const { status, response } = await types.saveDocument(req.params.type, req.body.data, req.body.username, req.body.priv_key, req.body.password);
  res.status(status).json(response);
};

/**
 * PUT /type/{type}/{hash}
 * Update an existing document
 */
export let updateDocument = async (req: Request, res: Response) => {
  const { status, response } = await types.saveDocument(req.params.type, req.body.data, req.body.username, req.body.priv_key, req.body.password, req.params.hash);
  res.status(status).json(response);
};

/**
 * DELETE /type/{type}/{hash}
 * Remove an document from type index
 */
export let deleteDocument = async (req: Request, res: Response) => {
  const { status, response } = await types.deleteDocument(req.params.type, req.params.hash, req.body.username);
  res.status(status).json(response);
};

/**
 * POST /user/create
 * Create a new user
 */
export let createUser = async (req: Request, res: Response) => {
  const { status, response } = await users.createUser(req.body.username, req.body.password);
  res.status(status).json(response);
};

/**
 * DELETE /user
 * Remove your account
 */
export let deleteUser = async (req: Request, res: Response) => {
  const { status, response } = await users.deleteUser(req.body.username, req.body.password);
  res.status(status).json(response);
};

/**
 * POST /user/login
 * Login user
 */
export let loginUser = async (req: Request, res: Response) => {
  const { status, response } = await users.loginUser(req.body.username, req.body.password);
  res.status(status).json(response);
};

/**
 * Validate request token
 */
export let validateToken = async (req: Request, res: Response, next: Function) => {
  // check header or url parameters or post parameters for token
  const token = req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ error: "No token provided." });
  }

  const decoded = <any> await users.validateToken(token);
  if (decoded) {
    req.body.username = decoded.username;
    next();
  } else {
    return res.status(401).json({ error: "Failed to authenticate token." });
  }
};
