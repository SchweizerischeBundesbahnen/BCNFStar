import { absoluteServerDir } from "../utils/files";
import { promisify } from "util";
import { exec } from "child_process";
import { join } from "path";
import MetanomeAlgorithm from "./metanomeAlgorithm";
import { metanomeQueue, queueEvents } from "./queue";

export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "results");
const OUTPUT_SUFFIX = "_inds_binder.json";

export default class MetanomeINDAlgorithm extends MetanomeAlgorithm {
  constructor(tables: string[]) {
    super(tables);
    this.schemaAndTables = this.schemaAndTables.sort();
  }

  async run(): Promise<{}> {
    const asyncExec = promisify(exec);
    let job = await metanomeQueue.add(
      `get fds for ${this.schemaAndTables}`,
      this.command(this.schemaAndTables)
    );
    await job.waitUntilFinished(queueEvents);
    if (job.isFailed()) return {};

    let dict = {};
    dict[this.schemaAndTables.join("_")] = join(
      OUTPUT_DIR,
      MetanomeINDAlgorithm.outputFileName(this.schemaAndTables)
    );
    return dict;
  }

  // location of the algorithm JAR relative to the package.json directory
  protected algoJarPath(): string {
    return "BINDERFile.jar";
  }

  // location in the JAR where the algorithm is located
  protected algoClass(): string {
    return "de.metanome.algorithms.binder.BINDERFile";
  }

  // returns all files, that could contain relevant INDs for the table
  public static outputPath(tables: string[]): string {
    tables = tables.sort();
    return join(
      OUTPUT_DIR,
      MetanomeINDAlgorithm.outputFileName(tables) + "_inds"
    );
  }

  private static outputFileName(tables: string[]): string {
    return (
      tables.map((table) => table.replace(".", "_")).join("_") + OUTPUT_SUFFIX
    );
  }

  protected command(tables: string[]): string {
    return `java -Xmx${
      this.memory
    } -cp "${this.classpath()}" de.metanome.cli.App --algorithm "${this.algoClass()}" --db-connection "${this.dbPassPath()}" --db-type "${
      process.env.DB_TYPE
    }" --table-key "INPUT_FILES" --header  --tables "${tables.join(
      ","
    )}" --output "file:${MetanomeINDAlgorithm.outputFileName(tables)}"`.replace(
      /(\r\n|\n|\r)/gm,
      ""
    );
  }
}
