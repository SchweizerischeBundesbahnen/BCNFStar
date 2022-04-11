import { MetanomeConfig } from "@/definitions/IIndexTableEntry";
import { Request, Response } from "express";
import Normi from "../metanome/Normi";

export default async function getFDs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaAndTable = req.params.name;
    const forceRerun: boolean = !!req.params.forceRerun;
    const config = req.query as MetanomeConfig;
    delete config["forceRerun"];

    const normi = new Normi(schemaAndTable, config);

    const executeAndSend = async () => {
      await normi.execute();
      res.json(await normi.getResults());
    };
    if (forceRerun) await executeAndSend();
    else {
      try {
        res.json(await normi.getResults());
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
