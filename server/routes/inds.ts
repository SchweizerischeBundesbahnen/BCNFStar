import BINDER from "@/metanome/BINDER";
import { Request, Response } from "express";

export default async function getFDs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaAndTables = req.params.name.split(",");
    const forceRerun: boolean = !!req.params.forceRerun;
    const binder = new BINDER(schemaAndTables);
    if (forceRerun) {
      await binder.execute();
      res.json(await binder.getResults());
      return;
    }
    try {
      res.json(await binder.getResults());
    } catch (err) {
      // means file not found
      if (err.code === "ENOENT") {
        await binder.execute();
        res.json(await binder.getResults());
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res.status(502).json({ error: "Could not get inds for tables." });
  }
}
