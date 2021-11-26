import { pkgJsonDir } from "@/utils/files";

export const METANOME_CLI_JAR_PATH = "metanome/metanome-cli-1.1.0.jar";
export const POSTGRES_JDBC_JAR_PATH = "metanome/postgresql-42.2.24.jre7.jar";
export const PGPASS_PATH = process.env.PGPASSFILE;

export default abstract class MetanomeAlgorithm {
  public memory = "12g";
  public tables: string[];
  constructor(tables: string[]) {
    this.tables = tables;
  }
  run(): void {
    console.log("todo: implement run");
  }

  protected classpath(): string {
    const classpath_separator = process.platform === "win32" ? ";" : ":";
    return [METANOME_CLI_JAR_PATH, POSTGRES_JDBC_JAR_PATH, this.algoJarPath()]
      .map((jarpath) => pkgJsonDir + "/" + jarpath)
      .join(classpath_separator);
  }
  // location of the algorithm JAR relative to the package.json directory
  abstract algoJarPath(): string;
  // location in the JAR where the algorithm is located
  abstract algoClass(): string;
  protected command(): string {
    return `java -Xmx${this.memory} -cp "${this.classpath}" \
    de.metanome.cli.App --algorithm ${this.algoClass}\
    --db-connection D:/.pgpass --db-type postgresql 
    --table-key "INPUT_GENERATOR"
    --tables landing.t_c_caros_dispo_fde --output file:fde_max_det_5.json --algorithm-config isHumanIntheLoop:False`;
  }
}
