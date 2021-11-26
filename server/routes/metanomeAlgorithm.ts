import { pkgJsonDir } from '../utils/files';
import {join, dirname} from "path";

export const METANOME_CLI_JAR_PATH = "metanome/metanome-cli-1.1.0.jar";
export const POSTGRES_JDBC_JAR_PATH = "metanome/postgresql-9.3-1102-jdbc41.jar";
export const PGPASS_PATH = process.env.PGPASSFILE;

export default class MetanomeAlgorithm {
  public memory = "12g";
  public tables: string[];
  constructor(tables: string[]) {
    this.tables = tables;
  }
  run(): void {
    console.log("todo: implement run");
  }

  public classpath(): string {
    const classpath_separator = process.platform === "win32" ? ";" : ":";
    return [METANOME_CLI_JAR_PATH, POSTGRES_JDBC_JAR_PATH, this.algoJarPath()]
      .map((jarpath) => pkgJsonDir + "/" + jarpath)
      .join(classpath_separator);
  }
  // location of the algorithm JAR relative to the package.json directory
  public algoJarPath(): string {
      return '/metanome/Normalize-1.2-SNAPSHOT.jar';
  }
  // location in the JAR where the algorithm is located
  public algoClass(): string {
      return 'de.metanome.algorithms.normalize.Normi';
  }
  public command(): string {
    return `java -Xmx${this.memory} -cp "${this.classpath()}" de.metanome.cli.App --algorithm ${this.algoClass()} --db-connection C:/.pgpass --db-type postgresql --table-key "INPUT_GENERATOR" --tables public.test --output file:fde_max_det_5.json --algorithm-config isHumanInTheLoop:false`;
  }
}
