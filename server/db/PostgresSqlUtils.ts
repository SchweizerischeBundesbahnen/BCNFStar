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
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY ordinal_position`,
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
    const result = await this.pool.query<ForeignKeyResult>(`select 
    ns.nspname as "foreign_table_schema",
    cl.relname as "foreign_table_name", 
    att.attname as "foreign_column_name",
    table_schema,
    rel_referencing as "table_name",
    att2.attname as "column_name"
from
   (select 
        unnest(con1.conkey) as "parent", 
        unnest(con1.confkey) as "child", 
        con1.confrelid, 
        con1.conrelid,
        con1.conname,
        ns.nspname as table_schema,
        cl.relname as rel_referencing
    from 
        pg_class cl
        join pg_namespace ns on cl.relnamespace = ns.oid
        join pg_constraint con1 on con1.conrelid = cl.oid
   ) con
   join pg_attribute att on
       att.attrelid = con.confrelid and att.attnum = con.child
   join pg_class cl on
       cl.oid = con.confrelid
   join pg_attribute att2 on
       att2.attrelid = con.conrelid and att2.attnum = con.parent
   join pg_namespace ns on cl.relnamespace = ns.oid;`);
    return result.rows;
  }
  public getJdbcPath(): string {
    return "postgresql-42.3.1.jar";
  }
  public getDbmsName(): string {
    return "postgres";
  }
}
