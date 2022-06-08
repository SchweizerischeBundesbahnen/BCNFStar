import SqlUtils, {
  DbmsType,
  ForeignKeyResult,
  PrimaryKeyResult,
  SchemaQueryRow,
} from "./SqlUtils";
import { Pool, QueryConfig, PoolConfig } from "pg";

import ITablePage from "@/definitions/ITablePage";
import ITable from "@/definitions/ITable";
import { IColumnRelationship } from "@/definitions/IRelationship";
import {
  IRequestBodyTypeCasting,
  TypeCasting,
} from "@/definitions/TypeCasting";
import { query } from "express";
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
      `SELECT table_name, column_name, 
      case 
        when domain_name is not null then domain_name
        when data_type='character varying' THEN 'varchar('||character_maximum_length||')'
        when data_type='character' THEN 'varchar('||character_maximum_length||')'
        when data_type='numeric' THEN 'numeric('||numeric_precision||','||numeric_scale||')'
        else data_type
      end as data_type, 
      table_schema,
      case when 
      is_nullable = 'NO' then CAST(0 AS BIT) 
      else CAST(1 AS BIT) 
      end as is_nullable 
        FROM information_schema.columns 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY ordinal_position`,
      []
    );
    return query_result.rows;
  }

  public UNIVERSAL_DATATYPE(): string {
    return "text";
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

  public async getTablePage(
    tablename: string,
    schemaname: string,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    const tableExists = await this.tableExistsInSchema(schemaname, tablename);
    if (tableExists) {
      const query_result = await this.pool.query(
        `SELECT * FROM "${schemaname}"."${tablename}"
        LIMIT ${limit} 
        OFFSET ${offset}`
      );
      return {
        rows: query_result.rows,
        attributes: query_result.fields.map((v) => v.name),
      };
    } else {
      throw { error: "Table or schema doesn't exist" };
    }
  }

  public override async testTypeCasting(
    s: IRequestBodyTypeCasting
  ): Promise<TypeCasting> {
    const _sql: string = `
    SELECT ${s.column} FROM  ${s.schema}.${s.table}
    EXCEPT 
    SELECT CAST(CAST(${s.column} AS ${s.targetDatatype}) AS ${s.currentDatatype} ) FROM  ${s.schema}.${s.table} 
    `;
    try {
      console.log(_sql);
      const queryResult = await this.pool.query(_sql);
      if (queryResult.rowCount == 0) return TypeCasting.allowed;
      return TypeCasting.informationloss;
    } catch (Error) {
      console.log(Error.toString());
      return TypeCasting.forbidden;
    }
  }

  public async getTableRowCount(
    table: string,
    schema: string
  ): Promise<number> {
    const tableExists = await this.tableExistsInSchema(schema, table);
    if (tableExists) {
      // from https://stackoverflow.com/questions/7943233/fast-way-to-discover-the-row-count-of-a-table-in-postgresql
      const rowCountQuery = `SELECT (CASE WHEN c.reltuples < 0 THEN NULL -- never vacuumed
         WHEN c.relpages = 0 THEN float8 '0' -- empty table
         ELSE c.reltuples / c.relpages END
         * (pg_catalog.pg_relation_size(c.oid)
         / pg_catalog.current_setting('block_size')::int)
         )::bigint AS count
         FROM   pg_catalog.pg_class c
         WHERE  c.oid = '${schema}.${table}'::regclass;`;

      let queryResult = await this.pool.query(rowCountQuery);
      if (!queryResult.rows[0].count) {
        this.pool.query(`VACUUM ${schema}.${table}`);
        queryResult = await this.pool.query(rowCountQuery);
      }
      return queryResult.rows[0].count;
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
    att2.attname as "column_name",
    conname as "fk_name"
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

  public async getPrimaryKeys(): Promise<PrimaryKeyResult[]> {
    const result = await this.pool.query<PrimaryKeyResult>(
      this.QUERY_PRIMARY_KEYS
    );
    return result.rows;
  }

  public override async getViolatingRowsForFD(
    schema: string,
    table: string,
    lhs: Array<string>,
    rhs: Array<string>,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    if (!this.columnsExistInTable(schema, table, lhs.concat(rhs))) {
      throw Error("Columns don't exist in table.");
    }

    const query_result = await this.pool.query(
      this.violatingRowsForFD_SQL(schema, table, lhs, rhs) +
        `ORDER BY ${lhs.join(",")}
        LIMIT ${limit} 
        OFFSET ${offset}
        `
    );
    return {
      rows: query_result.rows,
      attributes: query_result.fields.map((v) => v.name),
    };
  }

  public override async getViolatingRowsForFDCount(
    schema: string,
    table: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): Promise<number> {
    if (!this.columnsExistInTable(schema, table, lhs.concat(rhs))) {
      throw Error("Columns don't exist in table.");
    }
    const count = await this.pool.query<{ count: number }>(
      `SELECT COALESCE(SUM(Count), 0) as count FROM 
      (
      ${this.violatingRowsForFD_SQL(schema, table, lhs, rhs)} 
      ) AS X
      `
    );
    return count.rows[0].count;
  }

  public async getViolatingRowsForSuggestedIND(
    referencingTable: ITable,
    referencedTable: ITable,
    columnRelationships: IColumnRelationship[],
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    if (
      !this.columnsExistInTable(
        referencingTable.schemaName,
        referencingTable.name,
        columnRelationships.map((c) => c.referencingColumn)
      )
    ) {
      throw Error("Columns don't exist in referencing.");
    }
    if (
      !this.columnsExistInTable(
        referencedTable.schemaName,
        referencedTable.name,
        columnRelationships.map((c) => c.referencedColumn)
      )
    ) {
      throw Error("Columns don't exist in referenced.");
    }
    const query_result = await this.pool.query(
      `${this.violatingRowsForSuggestedIND_SQL(
        referencingTable,
        referencedTable,
        columnRelationships
      )}` +
        `
        ORDER BY ${columnRelationships
          .map((cc) => cc.referencingColumn)
          .join(",")}
        LIMIT ${limit} 
        OFFSET ${offset}
        `
    );
    return {
      rows: query_result.rows,
      attributes: query_result.fields.map((v) => v.name),
    };
  }

  public async getViolatingRowsForSuggestedINDCount(
    referencingTable: ITable,
    referencedTable: ITable,
    columnRelationships: IColumnRelationship[]
  ): Promise<number> {
    if (
      !this.columnsExistInTable(
        referencingTable.schemaName,
        referencingTable.name,
        columnRelationships.map((c) => c.referencingColumn)
      )
    ) {
      throw Error("Columns don't exist in referencing.");
    }
    if (
      !this.columnsExistInTable(
        referencedTable.schemaName,
        referencedTable.name,
        columnRelationships.map((c) => c.referencedColumn)
      )
    ) {
      throw Error("Columns don't exist in referenced.");
    }

    const count = await this.pool.query<{ count: number }>(
      `SELECT COUNT (*) as count FROM 
      (
        ${this.violatingRowsForSuggestedIND_SQL(
          referencingTable,
          referencedTable,
          columnRelationships
        )}
      ) AS X
      `
    );
    return count.rows[0].count;
  }

  public async columnsExistInTable(
    schema: string,
    table: string,
    columns: Array<string>
  ): Promise<boolean> {
    try {
      const queryConfig: QueryConfig = {
        text: "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2",
        name: "columns-in-table",
        values: [schema, table],
      };
      const columnsInTable = await this.pool.query<{ column_name: string }>(
        queryConfig
      );
      return columns.every((c) =>
        columnsInTable.rows
          .map((d) => d.column_name.toLowerCase())
          .includes(c.toLowerCase())
      );
    } catch (e) {
      console.log(e);
      throw Error("Error while checking if table contains columns.");
    }
  }

  public getJdbcPath(): string {
    return "postgresql-42.3.1.jar";
  }
  public getDbmsName(): DbmsType {
    return DbmsType.postgres;
  }
}
