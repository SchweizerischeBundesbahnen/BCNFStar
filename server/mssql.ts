import {
  connect,
  IResult,
  config,
  query,
  pool,
  Connection,
  ConnectionPool,
} from "mssql";
import { isConstructorDeclaration } from "typescript";

export default class MsSqlUtils {
  private config: config;
  public connection: ConnectionPool;
  public constructor(
    server: string,
    database: string,
    user: string,
    password: string,
    port: number = 1433
  ) {
    this.config = {
      user,
      database,
      password,
      server,
      port,
      options: {
        encrypt: true, // for azure
        trustServerCertificate: true, // change to true for local dev / self-signed certs
      },
    };
  }

  public async init() {
    this.connection = await connect(this.config);
  }

  public async getSchema() {
    const result: IResult<{
      table_name: string;
      column_name: string;
      data_type: string;
      table_schema: string;
    }> = await query(`SELECT table_name, column_name, data_type, table_schema 
                      FROM information_schema.columns 
                      WHERE table_schema NOT IN ('information_schema')`);
    console.log(result);
  }
}

const mssql = new MsSqlUtils(
  "DESKTOP-JCCI1N9\\DBTEST",
  "SBB",
  "sa",
  "paulbosse1"
);
mssql.init().then(() => mssql.getSchema());
