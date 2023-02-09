// for the oldest version using actual HyFD with js fd extender see d8ceac79c3c6dea194ca803650481ee7fcbb956c
// HyFDExtended is basically just Normi without the actual normalization step with more HyFD settings,
// or HyFD with fd extension, and was written by us
import { join } from "path";

import { absoluteServerDir } from "@/utils/files";
import { splitTableString } from "@/utils/databaseUtils";
import { sqlUtils } from "@/db";
import { DbmsType } from "@/db/SqlUtils";
import HyFDExtended from "./HyFD";
import { rustAlgorithmName } from "@/definitions/IRustFd";

const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export default class RustFD extends HyFDExtended {
  protected override algoJarPath(): string {
    return "RustFDExtended-1.2-SNAPSHOT.jar";
  }

  public override algoClass(): string {
    return rustAlgorithmName;
  }

  protected override originalOutputPath(): string {
    const [, table] = splitTableString(this.schemaAndTable);
    return join(
      OUTPUT_DIR,
      (sqlUtils.getDbmsName() == DbmsType.mssql ? this.schemaAndTable : table) +
        "-rustfd_extended.txt"
    );
  }
}
