import { open } from "fs/promises";

import MetanomeAlgorithm from "./metanomeAlgorithm";
import { MetanomeResultType } from "@/definitions/IIndexFileEntry";
import { MetanomeConfig } from "@/definitions/IMetanomeJob";

export default abstract class InclusionDependencyAlgorithm extends MetanomeAlgorithm {
  constructor(tables: string[], config?: MetanomeConfig) {
    super(tables.sort(), config);
  }

  protected resultType(): MetanomeResultType {
    return MetanomeResultType.ind;
  }

  public async moveFiles(): Promise<void> {
    try {
      super.moveFiles();
    } catch (e) {
      // no file found, this likey means metanome didn't create a file
      // because there are no results. Therefore, create an empty file
      if (e.code == "ENOENT") {
        const handle = await open(await this.resultPath(), "wx");
        await handle.close();
      } else throw e;
    }
  }
}
