import { Request, Response } from "express";
import { sqlUtils } from "../db";

export async function getDbmsName(req: Request, res: Response) {
  try {
    res.json(sqlUtils.getDbmsName());
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res
        .status(502)
        .end("An error ocurred while getting info about db server dialect");
    }
  }
}
