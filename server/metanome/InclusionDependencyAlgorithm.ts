import { open } from "fs/promises";

import MetanomeAlgorithm from "./metanomeAlgorithm";
import { MetanomeResultType } from "@/definitions/IIndexFileEntry";
import { IMetanomeConfig } from "@/definitions/IMetanomeConfig";

export default abstract class InclusionDependencyAlgorithm extends MetanomeAlgorithm {
  constructor(tables: string[], config?: IMetanomeConfig) {
    super(tables.sort(), config);
  }

  protected resultType(): MetanomeResultType {
    return 'InclusionDependency';
  }

  public async moveFiles(): Promise<void> {
    try {
      await super.moveFiles();
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
