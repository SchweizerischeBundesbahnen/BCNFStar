// for the oldest version using actual HyFD with js fd extender see d8ceac79c3c6dea194ca803650481ee7fcbb956c
// HyFDExtended is basically just Normi without the actual normalization step with more HyFD settings,
// or HyFD with fd extension, and was written by us
import { join } from "path";

import { absoluteServerDir, splitlines } from "@/utils/files";
import { splitTableString } from "@/utils/databaseUtils";
import { sqlUtils } from "@/db";
import FunctionalDependencyAlgorithm from "./FunctionalDependencyAlgorithm";
import { readFile, writeFile } from "fs/promises";
import { DbmsType } from "@/db/SqlUtils";
import { hyfdAlgorithmName } from "@/definitions/IHyFD";

const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");


export default class HyFDExtended extends FunctionalDependencyAlgorithm {
  protected override algoJarPath(): string {
    return "HyFDExtended-1.2-SNAPSHOT.jar";
  }

  public override algoClass(): string {
    return hyfdAlgorithmName;
  }

  protected override tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_GENERATOR";
  }

  protected override originalOutputPath(): string {
    const [, table] = splitTableString(this.schemaAndTable);
    return join(
      OUTPUT_DIR,
      (sqlUtils.getDbmsName() == DbmsType.mssql ? this.schemaAndTable : table) +
        "-hyfd_extended.txt"
    );
  }

  /**
   * Reads metanome output, converts it from Metanome FD strings to JSON
   * and saves it
   */
  public override async processFiles(): Promise<void> {
    const path = await this.resultPath();
    const content = await readFile(path, {
      encoding: "utf-8",
    });
    //  format of fdString: "[c_address, c_anothercol] --> c_acctbal, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone"
    const result: Array<string> = splitlines(content)
      .map((fdString) => {
        const [lhsString, rhsString] = fdString.split(" --> ");
        return {
          lhsColumns: lhsString
            // remove brackets
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim())
            // remove empty strings if lhs is empty (to create [] instead of [''])
            .filter((s) => s),
          rhsColumns: rhsString
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
        };
      })
      .map((fd) => JSON.stringify(fd));

    await writeFile(path, result.join("\n"));
  }
}
