import BINDER from "../metanome/BINDER";
import { Request, Response } from "express";
import { MetanomeConfig } from "@/definitions/IIndexTableEntry";
import FAIDA from "../metanome/FAIDA";

export default async function getINDs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaAndTables = req.params.tableNames.split(",");
    const forceRerun: boolean = !!req.query.forceRerun;
    const config = req.query as MetanomeConfig;
    delete config["forceRerun"];

    // const algo = new BINDER(schemaAndTables, config);
    const algo = new FAIDA(schemaAndTables, config);

    const executeAndSend = async () => {
      await algo.execute();
      res.json(await algo.getResults());
    };
    if (forceRerun) await executeAndSend();
    else {
      try {
        res.json(await algo.getResults());
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
