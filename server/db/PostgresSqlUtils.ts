import SqlUtils, {
  DbmsType,
  ForeignKeyResult,
  PrimaryKeyResult,
  SchemaQueryRow,
} from "./SqlUtils";
import { Pool, QueryConfig, PoolConfig } from "pg";
import ITemptableScript from "@/definitions/ITemptableScripts";

import ITablePage from "@/definitions/ITablePage";
import ITable from "@/definitions/ITable";
import { IColumnRelationship } from "@/definitions/IRelationship";
import {
  IRequestBodyTypeCasting,
  TypeCasting,
} from "@/definitions/TypeCasting";
import {
  IRequestBodyUnionedKeys,
  KeyUnionability,
} from "@/definitions/IUnionedKeys";
import IRowCounts from "@/definitions/IRowCounts";
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

  public override tempTableName(name: string): string {
    return `__${name}__`;
  }

  public tempTableScripts(Sql: string, name: string): ITemptableScript {
    const ITemptableScript: ITemptableScript = {
      name: this.tempTableName(name),
      createScript: `
      DROP TABLE IF EXISTS ${this.tempTableName(name)}; 
      CREATE TEMP TABLE ${this.tempTableName(name)} AS
      ${Sql};
      `,
    };
    return ITemptableScript;
  }

  public override async createTempTable(
    _sql: string,
    name: string
  ): Promise<string> {
    const x: ITemptableScript = this.tempTableScripts(_sql, name);
    await this.pool.query(x.createScript);
    return x.name;
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

  public override async testKeyUnionability(
    t: IRequestBodyUnionedKeys
  ): Promise<KeyUnionability> {
    const _sql: string = this.testKeyUnionabilitySql(t);
    const result = await this.pool.query<{ count: number }>(_sql);
    if (result.rows[0].count == 0) return KeyUnionability.allowed;
    return KeyUnionability.forbidden;
  }

  /** The "null"-check is relevant for unionability-checks. */
  public override escape(str: string): string {
    if (str.toLowerCase() == "null") return "null";
    return `"${str}"`;
  }

  public override async getDatatypes(): Promise<string[]> {
    const _sql: string = "select typname from pg_type";
    const result = await this.pool.query(_sql);
    return result.rows.map((row) => row.typname);
  }

  public override async testTypeCasting(
    s: IRequestBodyTypeCasting
  ): Promise<TypeCasting> {
    const _sql: string = this.testTypeCastingSql(s);
    try {
      const queryResult = await this.pool.query(_sql);
      if (queryResult.rowCount == 0) return TypeCasting.allowed;
      return TypeCasting.informationloss;
    } catch (Error) {
      return TypeCasting.forbidden;
    }
  }

  public async getTableRowCount(
    table: string,
    schema: string
  ): Promise<IRowCounts> {
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
      const count = queryResult.rows[0].count;
      return { entries: count, groups: count };
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
    _sql: string,
    lhs: Array<string>,
    rhs: Array<string>,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    const tableName: string = await this.createTempTable(_sql, "X");
    const query_result = await this.pool.query(
      this.violatingRowsForFD_SQL(tableName, lhs, rhs) +
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
    sql: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): Promise<{ entries: number; groups: number }> {
    const tempTable: string = await this.createTempTable(sql, "X");
    const result = await this.pool.query<{ entries: number; groups: number }>(
      this.getViolatingRowsForFDCount_Sql(tempTable, lhs, rhs)
    );
    return result.rows[0];
  }

  public async getViolatingRowsForSuggestedIND(
    referencingTableSql: string,
    referencedTableSql: string,
    columnRelationships: IColumnRelationship[],
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    const referencingTempTable: string = await this.createTempTable(
      referencingTableSql,
      "X"
    );
    const referencedTempTable: string = await this.createTempTable(
      referencedTableSql,
      "Y"
    );

    const query_result = await this.pool.query(
      `${this.violatingRowsForSuggestedIND_SQL(
        referencingTempTable,
        referencedTempTable,
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
    referencingTableSql: string,
    referencedTableSql: string,
    columnRelationships: IColumnRelationship[]
  ): Promise<IRowCounts> {
    const referencingTable: string = await this.createTempTable(
      referencingTableSql,
      "X"
    );
    const referencedTable: string = await this.createTempTable(
      referencedTableSql,
      "Y"
    );

    const count = await this.pool.query<IRowCounts>(
      this.getViolatingRowsForINDCount_Sql(
        referencingTable,
        referencedTable,
        columnRelationships
      )
    );
    return count.rows[0];
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
