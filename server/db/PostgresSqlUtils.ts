import SqlUtils, { SchemaQueryRow, TableHead } from "./SqlUtils";
import { Pool, QueryConfig } from "pg";

export default class PostgresSqlUtils extends SqlUtils {
  protected pool: Pool;
  init(): void {
    this.pool = new Pool({});
  }
  public async getSchema(): Promise<SchemaQueryRow[]> {
    const client = await this.pool.connect();
    const query_result = await client.query<{
      table_name: string;
      data_type: string;
      column_name: string;
      table_schema: string;
    }>(
      // the last line excludes system tables
      `SELECT table_name, column_name, data_type, table_schema 
        FROM information_schema.columns 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')`,
      []
    );
    return query_result.rows;
  }

  public async tableExistsInSchema(
    schema: string,
    table: string
  ): Promise<boolean> {
    const client = await this.pool.connect();
    const queryConfig: QueryConfig = {
      text: "SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2",
      name: "table-exists-postgres",
      values: [schema, table],
    };
    const table_exists = await client.query(queryConfig);
    return table_exists.rowCount > 0;
  }
  public async getTableHead(
    tableschema: string,
    tablename: string
  ): Promise<TableHead | { error: string }> {
    const tableExists = await this.tableExistsInSchema(tableschema, tablename);
    if (tableExists) {
      const client = await this.pool.connect();
      const query_result = await client.query(
        `SELECT * FROM ${tableschema}.${tablename} LIMIT 10`
      );
      return {
        data: query_result.rows,
        columns: query_result.fields.map((v) => v.name),
      };
    } else {
      return { error: "Table or schema doesn't exist" };
    }
  }
  public getJdbcPath(): String {
    return "postgresql-42.3.1.jar";
  }
}
