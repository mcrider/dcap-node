import { Response, Request, NextFunction } from "express";
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
 * GET /object/{object}
 * Show object by ID
 */
export let getObject = async (req: Request, res: Response) => {
  // vars := mux.Vars(r)
  // objectID := vars["objectID"]
  // fmt.Fprintln(w, "Object show:", objectID)
  const data = await storage.getObject(req.params.id);
  res.json({
    label: "getObject: " + req.params.id,
    data: data
  });
};

/**
 * GET /type/{type}
 * Get type by name (shows index of objects)
 */
export let getType = (req: Request, res: Response) => {
  // vars := mux.Vars(r);
  // docType := vars["docType"];
  // fmt.Fprintln(w, "Object Index for ", docType);
  res.json({
    label: "getType: " + req.params.id
  });
};

/**
 * GET /type/{type}/schema
 * Get type schema
 */
export let getTypeSchema = (req: Request, res: Response) => {
  const type = global.typeSchemas.get(req.params.id);
  const response = type ? type.schema : { error: "Type not found" };
  res.json(response);
};
