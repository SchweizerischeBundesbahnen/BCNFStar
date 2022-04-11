import { absoluteServerDir } from "../utils/files";
import { join } from "path";
import { sqlUtils } from "../db";
import { rename } from "fs/promises";
import { createHash, randomUUID } from "crypto";
import * as _ from "lodash";
import { totalmem } from "os";
import { addToIndex, getIndexContent } from "./IndexFile";

export type MetanomeConfig = Record<string, string | number | boolean>;

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";

export default abstract class MetanomeAlgorithm {
  public static resultsFolder = join(
    absoluteServerDir,
    "metanome",
    "bcnfstar_results"
  );

  // FOR USE FROM INSIDE QUEUE

  /**
   * Moves files from metanome output folder to a more permanent location
   */
  public async moveFiles(): Promise<void> {
    return rename(this.originalOutputPath(), await this.resultPath());
  }

  /**
   * adds this algorithm execution to the index file.
   * The index file is used to locate metanome result files.
   * Previously, the file was identified by concatenating the
   * table names in the file name, but this was impossible
   * since file names have limited length
   */
  public addToIndexFile(): Promise<void> {
    return addToIndex({
      tables: this.schemaAndTables,
      algorithm: this.algoClass(),
      dbmsName: sqlUtils.getDbmsName(),
      database: process.env.DB_DATABASE,
      fileName: randomUUID() + ".json",
      config: this.config,
      createDate: Date.now().toString(),
    });
  }

  /**
   * post-processing for moved files
   */
  public abstract processFiles(): Promise<void>;

  /**
   * Returns the desired metanome results for the
   * selected table if they exists.
   * @throws an error that is of form
   * { code: 'EMOENT' } if no results exist
   */
  public abstract getResults(): Promise<any>;

  // FOR USE FROM OUTSIDE QUEUE

  /**
   * Adds a job to the metanome queue that runs the requested algorithm
   * @returns Promise that resolves once the algorithm execution finishes
   */
  public abstract execute(): Promise<void>;

  /**
   * @returns terminal command to execute the algorithm as string
   */
  public command(): string {
    return `java -Xmx${
      this.memory
    } -cp "${this.classpath()}" de.metanome.cli.App --algorithm "${this.algoClass()}" --db-connection "${this.dbPassPath()}" --db-type "${
      process.env.DB_TYPE
    }" --table-key "${this.tableKey()}"  --tables "${this.schemaAndTables.join(
      ","
    )}" --output "file:${this.outputFileName()}" ${this.configString()}}`.replace(
      /(\r\n|\n|\r)/gm,
      ""
    );
  }

  // INTERNAL

  protected classpath_separator = process.platform === "win32" ? ";" : ":";
  protected config: MetanomeConfig;
  protected schemaAndTables: string[];
  constructor(tables: string[], config: MetanomeConfig = {}) {
    this.schemaAndTables = tables;
    this.config = config;
  }

  /**
   * Defines the needed classes to run the algorithm for the Java CLI
   * @returns plattform-dependent string to be used after -cp argument
   */
  protected classpath(): string {
    const classpath_separator = process.platform === "win32" ? ";" : ":";
    return [
      METANOME_CLI_JAR_PATH,
      sqlUtils.getJdbcPath(),
      this.algoJarPath(),
    ].join(classpath_separator);
  }

  /**
   * @returns absolute location of a file containing results for these this.schemaAndTables and this algorithm
   * this is the final path after all operations
   */
  public async resultPath(): Promise<string> {
    const metadata = await getIndexContent();
    const entry = metadata.find((entry) => {
      return (
        _.isEqual(this.schemaAndTables, entry.tables) &&
        // _.isEqual(this.config, entry.config) &&
        entry.algorithm == this.algoClass()
      );
    });
    if (!entry) throw { code: "ENOENT" };
    return join(MetanomeAlgorithm.resultsFolder, entry.fileName);
  }
  /**
   * Location of the algorithm-specific jar file relative to the metanome folder
   */
  protected abstract algoJarPath(): string;

  /**
   * Location of the main class file of the algorithm in the JAR defined in {@link algoJarPath}
   */
  protected abstract algoClass(): string;

  /**
   * algorithm-specific table key required by the metanome CLI
   * Defines whether the algorithm is made to be used work on files or database tables
   * (we're accessing database tables regardless)
   */
  protected abstract tableKey(): "INPUT_GENERATOR" | "INPUT_FILES";

  protected dbPassPath(): string {
    if (process.env.DB_PASSFILE == undefined) {
      throw new Error("missing DB_PASSFILE in env.local");
    }
    return process.env.DB_PASSFILE;
  }

  /**
   * @returns File name to be passed to metanome as a name for result files
   */
  protected outputFileName(): string {
    return createHash("md5").update(this.schemaAndTables.join()).digest("hex");
  }

  /**
   * @returns location of file generated by Metanome
   */
  protected abstract originalOutputPath(): string;

  /**
   * @returns a valid java memory string to be put after -xmx
   * Checks whether config.memory is a valid java memory string
   * and returns it if it is, otherwise it will use 75% of total
   * system memory
   */
  protected memory(): string {
    const asNum = +this.config.memory;
    // Memory can be a number bigger than 2MB which is a multiple of 1024
    if (+asNum && !(asNum % 1024) && asNum >= 2 * 1024 * 1024)
      return this.config.memory.toString();
    // or a number with a suffix abbreviation (kilo, mega, giga...)
    else if (new RegExp("d+[KkMmGgTt]").test(this.config.memory.toString()))
      return this.config.memory.toString();
    else return ((totalmem() * 0.75) / 1024).toFixed(0) + "k";
  }

  /**
   * @returns config in metanome-readable format
   */
  protected configString(): string {
    if (!Object.keys(this.config).length) return "";
    return (
      "--algorithm-config " +
      Object.entries(this.config)
        .filter((item) => item[0] !== "memory")
        .map((item) => `${item[0]}:${item[1]}`)
        .join(",")
    );
  }
}
