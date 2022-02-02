import SqlUtils, { ForeignKeyResult, SchemaQueryRow } from "./SqlUtils";
import { Pool, QueryConfig, PoolConfig } from "pg";

import ITableHead from "@/definitions/ITableHead";
export default class PostgresSqlUtils extends SqlUtils {
  protected config: PoolConfig;
  public constructor(
    host: string,
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
      host,
      port,
    };
  }

  // ATTENTION: use a client obtained by const client = this.pool.connect to execute multiple
  // statements in a single transaction, and then make sure to call client.release() in any case
  // or the server will not be able to handle any further requests!
  // if you don't need transactions, just do this.pool.query, which does the connecting and releasing for you
  protected pool: Pool;
  init(): void {
    this.pool = new Pool(this.config);
  }
  public async getSchema(): Promise<SchemaQueryRow[]> {
    const query_result = await this.pool.query<SchemaQueryRow>(
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
    const queryConfig: QueryConfig = {
      text: "SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2",
      name: "table-exists-postgres",
      values: [schema, table],
    };
    const table_exists = await this.pool.query(queryConfig);
    return table_exists.rowCount > 0;
  }

  public async getTableHead(
    tablename: string,
    schemaname: string,
    limit: number
  ): Promise<ITableHead> {
    const tableExists = await this.tableExistsInSchema(schemaname, tablename);
    if (tableExists) {
      const query_result = await this.pool.query(
        `SELECT * FROM ${schemaname}.${tablename} LIMIT ${limit}`
      );
      return {
        rows: query_result.rows,
        attributes: query_result.fields.map((v) => v.name),
      };
    } else {
      throw { error: "Table or schema doesn't exist" };
    }
  }

  public async getTableRowCount(
    table: string,
    schema: string
  ): Promise<number> {
    const tableExists = await this.tableExistsInSchema(schema, table);
    if (tableExists) {
      const query_result = await this.pool.query(
        `SELECT COUNT(*) FROM ${schema}.${table}`
      );
      return query_result.rows[0].count;
    } else {
      throw {
        error: "Table or schema does not exist in database",
      };
    }
  }

  public async getForeignKeys(): Promise<ForeignKeyResult[]> {
    const result = await this.pool.query<ForeignKeyResult>(`SELECT
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
            AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')`);
    return result.rows;
  }
  public getJdbcPath(): string {
    return "postgresql-42.3.1.jar";
  }
}
