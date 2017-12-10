import { Response, Request, NextFunction } from "express";
import * as Ajv from "ajv";

import * as storage from "./storage";

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
  const response = type ? await storage.getObject(type.hash) : { error: "Type not found" };
  res.json(response);
};

/**
 * GET /type/{type}/schema
 * Get type schema
 */
export let getTypeSchema = (req: Request, res: Response) => {
  const type = global.dcap.typeSchemas.get(req.params.type);
  const response = type ? type.schema : { error: "Type not found" };
  res.json(response);
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
export let saveObject = async (req: Request, res: Response) => {
  const type = global.dcap.typeSchemas.get(req.params.type);

  // Check that type in URL exists
  if (!type) {
    res.json({ error: `Type "${req.params.type}" does not exist` });
    return;
  }

  // Validate against schema
  const ajv = new Ajv();
  const valid = ajv.validate(type.schema, req.body);
  if (!valid)  {
    res.json({ error: ajv.errorsText() });
    return;
  }

  // Save to IPFS
  const object = await storage.saveObject(req.body);

  // If it not already in there, save to type index
  const typeIndex = await storage.getObject(type.hash);
  // TODO

  res.json({
    success: "Object created",
    hash: object.hash
  });


};

/**
 * POST /type/{type}/{hash}
 * Update an existing object
 */
export let updateObject = async (req: Request, res: Response) => {
  console.log(req.body);
  // const data = await storage.saveObject(req.params.type);
  res.json({
    type: req.params.type,
    body: req.body
  });
};
