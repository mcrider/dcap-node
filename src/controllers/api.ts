"use strict";

import * as async from "async";
import * as request from "request";
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
export let getObject = (req: Request, res: Response) => {
  // vars := mux.Vars(r)
  // objectID := vars["objectID"]
  // fmt.Fprintln(w, "Object show:", objectID)
  res.json({
    label: "getObject: " + req.params.id + storage.getObject(req.params.id)
  });
};

/**
 * GET /type/{type}
 * Get type by
 */
export let getType = (req: Request, res: Response) => {
  // vars := mux.Vars(r);
  // docType := vars["docType"];
  // fmt.Fprintln(w, "Object Index for ", docType);
  res.json({
    label: "getType: " + req.params.id
  });
};
