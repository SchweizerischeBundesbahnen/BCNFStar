import { absoluteServerDir } from "../utils/files";
import { join } from "path";
import { sqlUtils } from "../db";

export type MetanomeConfig = Record<string, string | number | boolean>;
export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export default abstract class MetanomeAlgorithm {
  public memory = "12g";
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
   * File name to be passed to metanonme as a name for result files
   */
  protected abstract outputFileName(): string;

  protected configString(): string {
    if (!Object.keys(this.config).length) return "";
    return (
      "--algorithm-config " +
      Object.entries(this.config)
        .map((item) => `${item[0]}:${item[1]}`)
        .join(",")
    );
  }

  /**
   * Moves files from metanome output folder to a more permanent location
   */
  public abstract moveFiles(): Promise<void>;

  /**
   * post-processing for moved files
   */
  public abstract processFiles(): Promise<void>;

  /**
   * Returns the desired metanome results for the
   * selected table if they exists.
   * Throws an error otherwise that is of form
   * {}
   */
  public abstract getResults(): Promise<any>;

  /**
   * Adds a job to the metanome queue that runs the requested algorithm
   * @returns Promise that resolves once the algorithm execution finishes
   */
  public abstract execute(): Promise<void>;

  /**
   *
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
}
