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
