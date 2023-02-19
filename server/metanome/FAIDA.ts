import { absoluteServerDir, splitlines } from "@/utils/files";
import { join } from "path";

import InclusionDependencyAlgorithm from "./InclusionDependencyAlgorithm";
import { readFile, writeFile } from "fs/promises";
import IInclusionDependency from "@/definitions/IInclusionDependency";
import { faidaAlgorithmName } from "@/definitions/IFaida";
import { splitTableIdentifier } from "./utils";

const OUTPUT_DIR = join(absoluteServerDir, "metanome", "results");

export default class FAIDA extends InclusionDependencyAlgorithm {
  protected override algoJarPath(): string {
    // this version of FAIDA is slightly altered, it replaces calls to Validate.inclusiveBetween
    // with self-written assertions (instead of Validate.inclusiveBetween(1,1,x), write assert(x==1))
    return "FAIDA-1.2-SNAPSHOT.jar";
  }

  public override algoClass(): string {
    return faidaAlgorithmName;
  }

  protected override tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_FILES";
  }

  protected override originalOutputPath(): string {
    return join(OUTPUT_DIR, this.outputFileName() + "_inds");
  }

  /**
   * Metanome outputs INDs as a file where every line is a JSON object
   * describing an IND. This function adds a schemaIdentifier to that
   * object and stores all of them as a JSON array
   */
  public override async processFiles(): Promise<void> {
    const path = await this.resultPath();
    const content = await readFile(path, { encoding: "utf-8" });
    const result: Array<string> = splitlines(content)
      .map((line) => {
        let ind: IInclusionDependency = JSON.parse(line);
        ind.dependant.columnIdentifiers.map((cc) =>
          splitTableIdentifier(cc, this.schemaAndTables)
        );
        ind.referenced.columnIdentifiers.map((cc) =>
          splitTableIdentifier(cc, this.schemaAndTables)
        );
        return ind;
      })
      .map((ind) => JSON.stringify(ind));
    await writeFile(path, result.join("\n"));
  }
}


