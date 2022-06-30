import MetanomeAlgorithm from "@/metanome/metanomeAlgorithm";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { join } from "path";
import readline from "readline";
import { validationResult } from "express-validator";

export async function getMetanomeResults(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
    }
    await sendMetanomeResult(res, req.params.fileName);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res
        .status(502)
        .end("An error ocurred while getting info about metanome results");
    }
  }
}

export async function sendMetanomeResult(res: Response, fileName: string) {
  const path = join(MetanomeAlgorithm.resultsFolder, fileName);
  const fileStream = createReadStream(path, { encoding: "utf-8" });
  fileStream.on("error", (err) => {
    res.status(404).json({ message: "File not found!" });
  });
  const lines = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let firstLine = true;
  res.statusCode = 200;

  for await (const line of lines) {
    if (!firstLine) res.write(",");
    else {
      res.setHeader("Content-Type", "application/json");
      res.write("[");
    }
    firstLine = false;
    res.write(line);
  }
  res.end("]");
}
