import { isIMetanomeJob } from "@/definitions/IMetanomeJob.guard";
import { metanomeQueue, queueEvents } from "@/metanome/queue";
import { Request, Response } from "express";
import { basename } from "path";

export async function runMetanome(req: Request, res: Response) {
  if (!isIMetanomeJob(req.body)) {
    res.status(422).json({ errrors: "Invalid request body" });
    return;
  }
  try {
    const job = await metanomeQueue.add(
      `Executing ${req.body.algoClass} on ${req.body.schemaAndTables}`,
      req.body
    );
    const path = await job.waitUntilFinished(queueEvents);
    res.status(200).json({
      message: "Success!",
      fileName: basename(path),
    });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(502).json({
        message:
          "An error ocurred while executing metanome. See metanome queue page for details",
      });
    }
  }
}
