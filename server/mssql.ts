import sql from "mssql";

type SchemaQueryRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  table_schema: string;
};
export default class MsSqlUtils {
  private config: sql.config;
  public connection: sql.ConnectionPool;
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
    if (this.tableExistsInSchema(schemaname, tablename)) {
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
}

const mssql = new MsSqlUtils("localhost", "master", "sa", "71FplJob1lvQ");
mssql.init().then(() => mssql.getSchema());
