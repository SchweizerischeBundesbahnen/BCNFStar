import { absoluteServerDir } from "../utils/files";
import { join } from "path";
import MetanomeAlgorithm from "./metanomeAlgorithm";
import { assert } from "console";
import { metanomeQueue, queueEvents } from "./queue";

import { split } from "../utils/databaseUtils";
import { sqlUtils } from "../db";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
}

export default class MetanomeFDAlgorithm extends MetanomeAlgorithm {
  constructor(tables: string[]) {
    super(tables);
  }
  async run(): Promise<{}> {
    // const asyncExec = promisify(exec);
    for (const table of this.schemaAndTables) {
      let job = await metanomeQueue.add(
        `get fds for ${table}`,
        this.command([table])
      );
      await job.waitUntilFinished(queueEvents);
      if (job.isFailed()) return {};
    }

    let dict = {};
    this.schemaAndTables
      .map((schemaAndTable) => split(schemaAndTable)[1])
      .forEach(
        (table) =>
          (dict[table] = join(OUTPUT_DIR, table + "-hyfd_extended.txt"))
      );
    return dict;
  }

  // location of the algorithm JAR relative to the package.json directory
  protected override algoJarPath(): string {
    return "Normalize-1.2-SNAPSHOT.jar";
  }

  protected static originalOutputPath(schemaAndTable: string): string {
    const [, table] = split(schemaAndTable);

    return join(OUTPUT_DIR, table + "-hyfd_extended.txt");
  }

  public static outputPath(schemaAndTable: string): string {
    return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
  }

  // location in the JAR where the algorithm is located
  protected override algoClass(): string {
    return "de.metanome.algorithms.normalize.Normi";
  }

  protected renameCommand(schemaAndTable: string) {
    // mssql already outputs the hyfd results with schema
    if (sqlUtils.getDbmsName() === "mssql") return "";
    const command = process.platform == "win32" ? "move /y" : "mv -f";
    const originPath = MetanomeFDAlgorithm.originalOutputPath(schemaAndTable);
    const resultPath = MetanomeFDAlgorithm.outputPath(schemaAndTable);
    return `${command} "${originPath}" "${resultPath}"`;
  }

  protected override command(schemaAndTables: string[]): string {
    assert(schemaAndTables.length == 1);
    return `java -Xmx${
      this.memory
    } -cp "${this.classpath()}" de.metanome.cli.App --algorithm "${this.algoClass()}" --db-connection "${this.dbPassPath()}" --db-type "${
      process.env.DB_TYPE
    }" --table-key "INPUT_GENERATOR" --tables "${
      schemaAndTables[0]
    }" --output file:"${
      schemaAndTables[0]
    }_normalize_results.json" --algorithm-config isHumanInTheLoop:false && ${this.renameCommand(
      schemaAndTables[0]
    )}`;
  }
}
