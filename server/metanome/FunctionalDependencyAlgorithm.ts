import { join } from "path";

import MetanomeAlgorithm from "./metanomeAlgorithm";
import { absoluteServerDir } from "@/utils/files";
import { MetanomeResultType } from "@/definitions/IIndexFileEntry";
import { IMetanomeConfig } from "@/definitions/IMetanomeConfig";

const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export default abstract class FunctionalDependencyAlgorithm extends MetanomeAlgorithm {
  constructor(schemaAndTable: string, config?: IMetanomeConfig) {
    super([schemaAndTable], config);
  }

  protected resultType(): MetanomeResultType {
    return MetanomeResultType.fd;
  }

  get schemaAndTable(): string {
    return this.schemaAndTables[0];
  }
}
