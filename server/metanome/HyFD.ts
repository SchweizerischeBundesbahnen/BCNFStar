import { join } from "path";

import { absoluteServerDir, splitlines } from "@/utils/files";
import { splitTableString } from "@/utils/databaseUtils";
import FunctionalDependencyAlgorithm from "./FunctionalDependencyAlgorithm";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import IFunctionalDependency, {
  IHyFD,
} from "@/definitions/IFunctionalDependency";
import { writeFile } from "fs/promises";

interface HyFDConfig {
  INPUT_ROW_LIMIT: number; //=-1
  // (assumption): checks if memory is nearly full, and writes to disk if so
  ENABLE_MEMORY_GUARDIAN: boolean; //=true
  NULL_EQUALS_NULL: boolean; //=true
  VALIDATE_PARALLEL: boolean; //=true
  MAX_DETERMINANT_SIZE: number; //=-1
}

// everything in here is still nonsense, I just wanted to document the available options
export default class HyFD extends FunctionalDependencyAlgorithm {
  protected override algoJarPath(): string {
    return "HyFD-1.2-SNAPSHOT.jar";
  }

  public override algoClass(): string {
    return "de.metanome.algorithms.hyfd.HyFD";
  }

  protected override tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_GENERATOR";
  }

  protected override originalOutputPath(): string {
    const [, table] = splitTableString(this.schemaAndTable);
    return join(
      absoluteServerDir,
      "metanome",
      "results",
      this.outputFileName() + "_fds"
    );
  }

  /**
   * Reads metanome output, converts it from Metanome FD strings to JSON
   * and saves it
   */
  public override async processFiles(): Promise<void> {
    const path = await this.resultPath();
    const fileStream = createReadStream(path, { encoding: "utf-8" });

    const lines = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    const fdMap: Record<
      string,
      { lhsColumns: Set<string>; rhsColumns: Set<string> }
    > = {};
    for await (const line of lines) {
      const fd: IHyFD = JSON.parse(line);
      const lhsColumns = fd.determinant.columnIdentifiers.map(
        (ci) => ci.columnIdentifier
      );
      const key = lhsColumns.sort().join();
      if (!fdMap[key])
        fdMap[key] = {
          lhsColumns: new Set(lhsColumns),
          rhsColumns: new Set(lhsColumns),
        };

      fdMap[key].rhsColumns.add(fd.dependant.columnIdentifier);
    }

    // pushing fd extender
    const sortedFds = Object.values(fdMap).sort(
      (a, b) => a.lhsColumns.size - b.lhsColumns.size
    );
    let i = 1;
    let somethingChanged = true;
    while (somethingChanged) {
      console.log("round " + i++);
      somethingChanged = false;
      for (const fd of sortedFds) {
        for (const other of sortedFds) {
          if (other == fd) continue;
          if ([...fd.lhsColumns].every((c) => other.rhsColumns.has(c))) {
            for (const column of fd.rhsColumns) {
              if (!other.rhsColumns.has(column)) {
                somethingChanged = true;
              }
              other.rhsColumns.add(column);
            }
            fd.rhsColumns.forEach((c) => other.rhsColumns.add(c));
          }
        }
      }
    }
    // remove lhs from rhs
    const resultFds: Array<string> = sortedFds.map((fd) => {
      fd.lhsColumns.forEach((c) => fd.rhsColumns.delete(c));
      return JSON.stringify({
        lhsColumns: [...fd.lhsColumns],
        rhsColumns: [...fd.rhsColumns],
      });
    });
    await writeFile(path, resultFds.join("\n"));
  }
}
