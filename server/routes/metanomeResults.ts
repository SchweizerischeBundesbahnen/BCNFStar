import MetanomeAlgorithm from "../metanome/metanomeAlgorithm";
import { metanomeQueue } from "../metanome/queue";
import { Request, Response } from "express";

export async function getMetanomeResults(req: Request, res: Response) {
  try {
    res.json(await MetanomeAlgorithm.getIndexContent());
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res
        .status(502)
        .end("An error ocurred while getting info about metanome results");
    }
  }
}

export async function deleteMetanomeResults(req: Request, res: Response) {
  try {
    const file = req.params.file;
    res.json(
      await metanomeQueue.add(`Deleting metanome result: ${file}`, {
        config: {},
        jobType: "delete",
        schemaAndTables: [file],
      })
    );
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(502).end("An error ocurred while deleting a metanome result!");
    }
  }
}
