import { absoluteServerDir } from "../utils/files";
import { promisify } from "util";
import { exec } from "child_process";
import { join } from "path";
import { sqlUtils } from "../db";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export default abstract class MetanomeAlgorithm {
  public memory = "12g";
  protected classpath_separator = process.platform === "win32" ? ";" : ":";
  protected tables: string[];
  constructor(tables: string[]) {
    this.tables = tables;
  }
  abstract run(): Promise<{}>;

  protected classpath(): string {
    const classpath_separator = process.platform === "win32" ? ";" : ":";
    return [
      METANOME_CLI_JAR_PATH,
      sqlUtils.getJdbcPath(),
      this.algoJarPath(),
    ].join(classpath_separator);
  }
  // location of the algorithm JAR relative to the package.json directory
  protected abstract algoJarPath(): string;

  protected dbPassPath(): string {
    if (process.env.DB_PASSFILE == undefined) {
      throw new Error("missing DB_PASSFILE in env.local");
    }
    return process.env.DB_PASSFILE;
  }

  // location in the JAR where the algorithm is located
  protected abstract algoClass(): string;

  protected abstract command(tables: string[]): string;
}
