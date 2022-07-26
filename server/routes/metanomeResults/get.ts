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
      if (e.toString().includes("ENOENT"))
        res.status(404).end("File not found");
      else
        res
          .status(502)
          .end("An error ocurred while getting info about metanome results");
    }
  }
}

/**
 * Sends content of a metanome results file as a stream to prevent issues with
 * maximum file length in node
 * @param res Express response object
 * @param fileName of file in jsonlines format
 */
export async function sendMetanomeResult(res: Response, fileName: string) {
  let headersSent = false;
  function assureHeadersAreSent() {
    if (headersSent || res.headersSent) return;
    headersSent = true;
    res.setHeader("Content-Type", "application/json");
    res.write("[");
  }

  const path = join(MetanomeAlgorithm.resultsFolder, fileName);
  const fileStream = createReadStream(path, { encoding: "utf-8" });
  fileStream.on("error", (err) => {
    console.error(err);
    if (!res.header && !headersSent)
      res.status(404).json({ message: "File not found!" });
  });
  const lines = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let firstLine = true;
  res.statusCode = 200;

  for await (const line of lines) {
    if (!firstLine) {
      res.write(",");
    } else {
      firstLine = false;
      assureHeadersAreSent();
    }

    res.write(line);
  }
  assureHeadersAreSent();
  res.end("]");
}
