import sql from "mssql";
import SqlUtils, { ForeignKeyResult, SchemaQueryRow } from "./SqlUtils";
export default class MsSqlUtils extends SqlUtils {
  private config: sql.config;
  public connection: sql.ConnectionPool;
  public constructor(
    server: string,
    database: string,
    user: string,
    password: string,
    port: number = 1433
  ) {
    super();
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
    this.connection = await sql.connect(this.config);
  }

  public async getSchema(): Promise<Array<SchemaQueryRow>> {
    const result: sql.IResult<SchemaQueryRow> =
      await sql.query(`SELECT table_name, column_name, data_type, table_schema 
                      FROM information_schema.columns 
                      WHERE table_schema NOT IN ('information_schema')`);

    return result.recordset;
  }
  public async getTableHead(
    schemaname: string,
    tablename: string
  ): Promise<
    | { data: Array<Record<string, any>>; columns: Array<string> }
    | { error: string }
  > {
    const tableExists = await this.tableExistsInSchema(schemaname, tablename);
    if (tableExists) {
      const result: sql.IResult<any> = await sql.query(
        `SELECT TOP (10) * FROM [${schemaname}].[${tablename}]`
      );
      return {
        data: result.recordset,
        columns: Object.keys(result.recordset.columns),
      };
    } else {
      return { error: "Table or schema doesn't exist" };
    }
  }

  public async tableExistsInSchema(
    schema: string,
    table: string
  ): Promise<boolean> {
    const ps = new sql.PreparedStatement();
    ps.input("schema", sql.NVarChar);
    ps.input("table", sql.NVarChar);

    await ps.prepare(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = @schema AND table_name = @table"
    );
    const result = await ps.execute({ schema, table });
    return result.recordset.length > 0;
  }

  public async getForeignKeys(): Promise<ForeignKeyResult[]> {
    const result = await sql.query<ForeignKeyResult>(`SELECT
      tc.table_schema,
      tc.table_name, 
      kcu.column_name, 
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
  FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema NOT IN ('pg_catalog', 'information_schema');`);
    return result.recordset;
  }
  public getJdbcPath(): String {
    return "mssql-jdbc-9.4.1.jre8.jar";
  }
}
