import BINDER from "../metanome/BINDER";
import { Request, Response } from "express";
import { MetanomeConfig } from "@/definitions/IIndexTableEntry";

export default async function getINDs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaAndTables = req.params.tableNames.split(",");
    const forceRerun: boolean = !!req.params.forceRerun;
    const binder = new BINDER(schemaAndTables);
    const executeAndSend = async () => {
      await binder.execute(req.query as MetanomeConfig);
      res.json(await binder.getResults());
    };
    if (forceRerun) await executeAndSend();
    else {
      try {
        res.json(await binder.getResults());
      } catch (err) {
        // means file not found
        if (err.code === "ENOENT") {
          await executeAndSend();
        } else {
          throw err;
        }
      }
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res.status(502).json({ error: "Could not get fds for table... " });
  }
}
