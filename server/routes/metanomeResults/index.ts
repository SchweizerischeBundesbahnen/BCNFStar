import { Request, Response } from "express";
import { getIndexContent } from "@/metanome/IndexFile";
import { deleteMetanomeResults } from "./delete";
import { getMetanomeResults } from "./get";

export { getMetanomeResults };
export { deleteMetanomeResults };

export async function getMetanomeIndex(req: Request, res: Response) {
  try {
    res.json(await getIndexContent());
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res
        .status(502)
        .end("An error ocurred while getting info about metanome results");
    }
  }
}
