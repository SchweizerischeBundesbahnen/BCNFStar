import { Request, Response } from "express";
import { rm } from "fs/promises";
import { join } from "path";
import { deleteFromIndex } from "@/metanome/IndexFile";
import MetanomeAlgorithm from "@/metanome/metanomeAlgorithm";
/**
 * First tries to delete the metanome result identified by its file name (containing an UUID)
 * from the index file. Only if that was successful, also try to delete the actual file
 */
export async function deleteMetanomeResults(req: Request, res: Response) {
  try {
    const fileName = req.params.fileName;
    const wasDeletedFromIndex = await deleteFromIndex(fileName).catch((e) => {
      console.error(
        `Error while deleting ${fileName} from metanome index file:`
      );
      console.error(e);
    });
    if (wasDeletedFromIndex) {
      await rm(join(MetanomeAlgorithm.resultsFolder, fileName));
      res.json({ message: "Sucessfully deleted metanome entry!" });
    } else {
      res
        .status(404)
        .json({ message: "The file you wanted to delete could not be found" });
    }
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(502).json({
        message: "An error ocurred while deleting a metanome result!",
      });
    }
  }
}
