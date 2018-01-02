import { Response, Request, NextFunction } from "express";
import * as Ajv from "ajv";

import * as storage from "./storage";
import * as types from "./types";
import * as users from "./users";

/**
 * GET /
 * Show API info page
 */
export let getRoot = (req: Request, res: Response) => {
  res.render("api/index", {
    title: "dcap"
  });
};

/**
 * GET /type/{type}
 * Get type by name (shows index of objects)
 */
export let getType = async (req: Request, res: Response) => {
  const type = global.dcap.typeSchemas.get(req.params.type);
  if (type) {
    const response = await storage.getObject(type.hash);
    response.hash = type.hash;
    res.json(response);
  } else {
    res.status(404).json({ error: "Type not found" });
  }
};

/**
 * GET /type/{type}/schema
 * Get type schema
 */
export let getTypeSchema = (req: Request, res: Response) => {
  const type = global.dcap.typeSchemas.get(req.params.type);
  if (type) {
    res.json(type.schema);
  } else {
    res.status(404).json({ error: "Type not found" });
  }
};

/**
 * GET /object/{hash}
 * Show object by hash
 */
export let getObject = async (req: Request, res: Response) => {
  const data = await storage.getObject(req.params.hash);
  res.json(data);
};

/**
 * POST /type/{type}
 * Add a new object
 */
export let addObject = async (req: Request, res: Response) => {
  const { status, response } = await types.saveObject(req.params.type, req.body);
  res.status(status).json(response);
};

/**
 * POST /type/{type}/{hash}
 * Update an existing object
 */
export let updateObject = async (req: Request, res: Response) => {
  const { status, response } = await types.saveObject(req.params.type, req.body, req.params.hash);
  res.status(status).json(response);
};

/**
 * DELETE /type/{type}/{hash}
 * Update an existing object
 */
export let deleteObject = async (req: Request, res: Response) => {
  const { status, response } = await types.removeObject(req.params.type, req.params.hash);
  res.status(status).json(response);
};

/**
 * POST /user/register
 * Create a new user
 */
export let createUser = async (req: Request, res: Response) => {
  const { status, response } = await users.createUser(req.body.username, req.body.password);
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
