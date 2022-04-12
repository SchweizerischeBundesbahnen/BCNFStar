import { join } from "path";

import MetanomeAlgorithm from "./metanomeAlgorithm";
import { absoluteServerDir } from "@/utils/files";
import { MetanomeResultType } from "@/definitions/IIndexFileEntry";
import { MetanomeConfig } from "@/definitions/IMetanomeJob";

const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
}

export default abstract class FunctionalDependencyAlgorithm extends MetanomeAlgorithm {
  constructor(schemaAndTable: string, config?: MetanomeConfig) {
    super([schemaAndTable], config);
  }

  protected resultType(): MetanomeResultType {
    return MetanomeResultType.fd;
  }

  get schemaAndTable(): string {
    return this.schemaAndTables[0];
  }
}
