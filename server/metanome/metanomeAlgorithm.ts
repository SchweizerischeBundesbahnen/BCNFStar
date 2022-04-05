import { absoluteServerDir, initFile } from "../utils/files";
import { join } from "path";
import { sqlUtils } from "../db";
import { readFile, rename, writeFile } from "fs/promises";
import { createHash, randomUUID } from "crypto";
import * as _ from "lodash";
import {
  IIndexFileEntry,
  MetanomeConfig,
} from "@/definitions/IIndexTableEntry";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export default abstract class MetanomeAlgorithm {
  public memory = "12g";

  public static resultsFolder = join(
    absoluteServerDir,
    "metanome",
    "bcnfstar_results"
  );

  // FOR USE FROM INSIIDE QUEUE

  /**
   * Moves files from metanome output folder to a more permanent location
   */
  public async moveFiles(): Promise<void> {
    return rename(this.originalOutputPath(), await this.resultPath());
  }

  private static indexFileLocation = join(this.resultsFolder, "index.json");

  /**
   * adds this algorithm execution to the index file.
   * The index file is used to locate metanome result files.
   * Previously, the file was identified by concatenating the
   * table names in the file name, but this was impossible
   * since file names have limited length
   */
  public async addToIndexFile(): Promise<void> {
    const content = await MetanomeAlgorithm.getIndexContent();
    content.push({
      tables: this.schemaAndTables,
      algorithm: this.algoClass(),
      fileName: randomUUID() + ".json",
      config: this.config,
      createDate: Date.now().toString(),
    });
    return writeFile(
      MetanomeAlgorithm.indexFileLocation,
      JSON.stringify(content)
    );
  }

  /**
   * Deletes this file from the metanome index file
   * ATTENTION: THIS WONT DELETE THE FILE ITSELF
   * This is done so that this operation is as atomic as
   * possible, and is either completely clears or completely
   * fails, but doen't leave corrupted state. The calling context
   * is responsible for making sure both actions succeed
   * @param fileName name of the file to be deleted (without folders)
   */
  public static async deleteFileFromIndex(fileName: string): Promise<void> {
    const content = await this.getIndexContent();
    return writeFile(
      this.indexFileLocation,
      JSON.stringify(content.filter((entry) => entry.fileName !== fileName))
    );
  }

  public static async getIndexContent(): Promise<IIndexFileEntry[]> {
    await initFile(this.indexFileLocation, "[]");
    const contentString = await readFile(this.indexFileLocation, {
      encoding: "utf-8",
    });
    return JSON.parse(contentString);
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
  public abstract execute(config?: MetanomeConfig): Promise<void>;

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
    const metadata = await MetanomeAlgorithm.getIndexContent();
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
   * @returns File name to be passed to metanonme as a name for result files
   */
  protected outputFileName(): string {
    return createHash("md5").update(this.schemaAndTables.join()).digest("hex");
  }

  /**
   * @returns location of file generated by Metanome
   */
  protected abstract originalOutputPath(): string;

  /**
   * @returns location where file shouuld be moved to
   */

  protected configString(): string {
    if (!Object.keys(this.config).length) return "";
    return (
      "--algorithm-config " +
      Object.entries(this.config)
        .map((item) => `${item[0]}:${item[1]}`)
        .join(",")
    );
  }
}
