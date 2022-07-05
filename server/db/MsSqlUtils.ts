import ITablePage from "@/definitions/ITablePage";
import sql, { IRow } from "mssql";
import SqlUtils, {
  DbmsType,
  ForeignKeyResult,
  PrimaryKeyResult,
  SchemaQueryRow,
} from "./SqlUtils";
import ITable from "@/definitions/ITable";
import { IColumnRelationship } from "@/definitions/IRelationship";
import ITemptableScript from "@/definitions/ITemptableScripts";
import {
  IRequestBodyTypeCasting,
  TypeCasting,
} from "@/definitions/TypeCasting";
import {
  IRequestBodyUnionedKeys,
  KeyUnionability,
} from "@/definitions/IUnionedKeys";
import IRowCounts from "@/definitions/IRowCounts";

// WARNING: make sure to always unprepare a PreparedStatement after everything's done
// (or failed*), otherwise it will eternally use one of the connections from the pool and
// prevent new queries
// * this means: use try-finally

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
      requestTimeout: 180000,
    };
  }

  public async init() {
    this.connection = await sql.connect(this.config);
  }

  public UNIVERSAL_DATATYPE(): string {
    return "varchar(max)";
  }

  public tempTableName(name: string): string {
    return `#${name}`;
  }

  /** The #{name} is syntax-sugar in mssql to craete a temp table. It is dropped after the session ends by the dbms.
   */
  public tempTableScripts(Sql: string, name: string): ITemptableScript {
    const ITemptableScript: ITemptableScript = {
      name: this.tempTableName(name),
      createScript: `
      DROP TABLE IF EXISTS ${this.tempTableName(name)}; 
      SELECT * INTO ${this.tempTableName(name)} FROM (${Sql}) AS X;
      `,
    };
    return ITemptableScript;
  }

  public override async createTempTable(
    _sql: string,
    name: string
  ): Promise<string> {
    const x: ITemptableScript = this.tempTableScripts(_sql, name);
    await sql.query(x.createScript);
    return x.name;
  }

  public async getSchema(): Promise<Array<SchemaQueryRow>> {
    const result = await sql.query<SchemaQueryRow>(`SELECT 
      t.name as table_name, 
      s.name as [table_schema],
        [column_name] = c.name,
        [data_type]         = 
           CASE 
             WHEN tp.[name] IN ('varchar', 'char') THEN tp.[name] + '(' + IIF(c.max_length = -1, 'max', CAST(c.max_length AS VARCHAR(25))) + ')' 
             WHEN tp.[name] IN ('nvarchar','nchar') THEN tp.[name] + '(' + IIF(c.max_length = -1, 'max', CAST(c.max_length / 2 AS VARCHAR(25)))+ ')'      
             WHEN tp.[name] IN ('decimal', 'numeric') THEN tp.[name] + '(' + CAST(c.[precision] AS VARCHAR(25)) + ', ' + CAST(c.[scale] AS VARCHAR(25)) + ')'
             WHEN tp.[name] IN ('datetime2') THEN tp.[name] + '(' + CAST(c.[scale] AS VARCHAR(25)) + ')'
             ELSE tp.[name]
           END,
           c.is_nullable
       FROM sys.tables t 
       JOIN sys.schemas s ON t.schema_id = s.schema_id
       JOIN sys.columns c ON t.object_id = c.object_id
       JOIN sys.types tp ON c.user_type_id = tp.user_type_id
    `);

    return result.recordset;
  }
  public async getTablePage(
    tablename: string,
    schemaname: string,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    const tableExists = await this.tableExistsInSchema(schemaname, tablename);
    if (tableExists) {
      const result = await sql.query<any>(
        `SELECT * FROM [${schemaname}].[${tablename}]
        ORDER BY (SELECT NULL) 
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY`
      );
      return {
        rows: result.recordset,
        attributes: Object.keys(result.recordset.columns),
      };
    } else {
      throw { error: "Table or schema doesn't exist" };
    }
  }

  /** The "null"-check is relevant for unionability-checks. */
  public override escape(str: string): string {
    if (str.toLowerCase() == "null") return "null";
    return `[${str}]`;
  }

  public override async testKeyUnionability(
    t: IRequestBodyUnionedKeys
  ): Promise<KeyUnionability> {
    const _sql: string = this.testKeyUnionabilitySql(t);
    const result: sql.IResult<any> = await sql.query(_sql);
    if (result.recordset[0].count == 0) return KeyUnionability.allowed;
    return KeyUnionability.forbidden;
  }

  public override async getDatatypes(): Promise<string[]> {
    const _sql: string = "select name from sys.types";
    const result: sql.IResult<any> = await sql.query<{ name: string }>(_sql);
    return result.recordset.map((record) => record.name);
  }

  public override async testTypeCasting(
    s: IRequestBodyTypeCasting
  ): Promise<TypeCasting> {
    const _sql: string = this.testTypeCastingSql(s);

    try {
      const result: sql.IResult<any> = await sql.query(_sql);
      if (result.recordset.length == 0) return TypeCasting.allowed;
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
      const queryResult = await sql.query(`SELECT
      count= SUM(st.row_count)
   FROM
      sys.dm_db_partition_stats st
   WHERE
       object_name(object_id) = '${table}' 
       AND (index_id < 2)
       AND object_schema_name(object_id) = '${schema}'`);
      const count = +queryResult.recordset[0].count;
      return { entries: count, groups: count };
    } else {
      throw {
        error: "Table or schema does not exist in database",
      };
    }
  }

  /**
   * This also checks if table and schema exist in database.
   */
  public async columnsExistInTable(
    schema: string,
    table: string,
    columns: Array<string>
  ): Promise<boolean> {
    const ps = new sql.PreparedStatement();
    try {
      ps.input("schema", sql.NVarChar);
      ps.input("table", sql.NVarChar);

      await ps.prepare(
        "select column_name from INFORMATION_SCHEMA.COLUMNS WHERE table_schema = @schema AND table_name = @table"
      );
      const result: sql.IResult<string> = await ps.execute({ schema, table });
      return columns.every((c) =>
        result.recordset
          .map((r) => r.toString().toLowerCase())
          .includes(c.toLowerCase())
      );
    } catch (e) {
      console.log(e);
      throw Error("Error while checking if table contains columns.");
    } finally {
      ps.unprepare();
    }
  }

  public async tableExistsInSchema(
    schema: string,
    table: string
  ): Promise<boolean> {
    const ps = new sql.PreparedStatement();

    try {
      ps.input("schema", sql.NVarChar);
      ps.input("table", sql.NVarChar);

      await ps.prepare(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = @schema AND table_name = @table"
      );
      const result = await ps.execute({ schema, table });
      return result.recordset.length > 0;
    } finally {
      ps.unprepare();
    }
  }

  public async schemaExistsInDatabase(schema: string): Promise<boolean> {
    const ps = new sql.PreparedStatement();
    ps.input("schema", sql.NVarChar);

    await ps.prepare(
      "SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = @schema"
    );
    const result = await ps.execute({ schema });
    return result.recordset.length > 0;
  }

  public async getRedundantValuesByColumns(
    table: string,
    columns: Array<string>
  ): Promise<any> {
    const stringColumns = columns.map((col) => '"' + col + '"').join(",");
    const query_result = await sql.query<SchemaQueryRow>(
      `SELECT SUM(redundance)
      FROM (COUNT(*) as redundance from (${table}) as temp_table GROUP BY ${stringColumns}) as temp_table_2
      WHERE redundance != 1`
    );
    return query_result;
  }

  public async getRedundantGroupLengthByColumns(
    table: string,
    columns: Array<string>
  ): Promise<any> {
    const stringColumns = columns.map((col) => '"' + col + '"').join(",");
    const query_result = await sql.query<SchemaQueryRow>(
      `SELECT COUNT(*)
      FROM (SELECT ${stringColumns}, COUNT(*) as redundance from (${table}) as temp_table GROUP BY ${stringColumns}) as temp_table_2`
    );
    return query_result;
  }

  public async getMaxValueByColumn(
    table: string,
    column: string
  ): Promise<any> {
    const query_result = await sql.query<SchemaQueryRow>(
      `SELECT MAX(LENGTH(${column}::text)) from ${table}`
    );
    return query_result;
  }

  public async getColumnSample(table: string, column: string): Promise<any> {
    const query_result = await sql.query<SchemaQueryRow>(
      `SELECT ${column} from ${table} LIMIT 1000`
    );
    return query_result;
  }

  public override async getViolatingRowsForFD(
    _sql: string,
    lhs: Array<string>,
    rhs: Array<string>,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    // if (!this.columnsExistInTable(schema, table, lhs.concat(rhs))) {
    //   throw Error("Columns don't exist in table.");
    // }
    const table: string = await this.createTempTable(_sql, "X");

    const result: sql.IResult<any> = await sql.query(
      this.violatingRowsForFD_SQL(table, lhs, rhs) +
        ` ORDER BY ${lhs.join(",")}
          OFFSET ${offset} ROWS
          FETCH NEXT ${limit} ROWS ONLY
        `
    );
    return {
      rows: result.recordset,
      attributes: Object.keys(result.recordset.columns),
    };
  }

  public async getViolatingRowsForSuggestedIND(
    referencingTableSql: string,
    referencedTableSql: string,
    columnRelationships: IColumnRelationship[],
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    // if (
    //   !this.columnsExistInTable(
    //     referencingTable.schemaName,
    //     referencingTable.name,
    //     columnRelationships.map((c) => c.referencingColumn)
    //   )
    // ) {
    //   throw Error("Columns don't exist in referencing.");
    // }
    // if (
    //   !this.columnsExistInTable(
    //     referencedTable.schemaName,
    //     referencedTable.name,
    //     columnRelationships.map((c) => c.referencedColumn)
    //   )
    // ) {
    //   throw Error("Columns don't exist in referenced.");
    // }

    const result: sql.IResult<any> = await sql.query(
      this.violatingRowsForSuggestedIND_SQL(
        referencingTableSql,
        referencedTableSql,
        columnRelationships
      ) +
        ` ORDER BY ${columnRelationships
          .map((cc) => cc.referencingColumn)
          .join(",")}
          OFFSET ${offset} ROWS
          FETCH NEXT ${limit} ROWS ONLY
        `
    );
    return {
      rows: result.recordset,
      attributes: Object.keys(result.recordset.columns),
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
    const result = await sql.query<IRowCounts>(
      this.getViolatingRowsForINDCount_Sql(
        referencingTable,
        referencedTable,
        columnRelationships
      )
    );
    return result.recordset[0];
  }

  public async getViolatingRowsForFDCount(
    _sql: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): Promise<IRowCounts> {
    const result = await sql.query<IRowCounts>(
      this.getViolatingRowsForFDCount_Sql(_sql, lhs, rhs)
    );
    return result.recordset[0];
  }

  public async getForeignKeys(): Promise<ForeignKeyResult[]> {
    const result = await sql.query<ForeignKeyResult>(`
  SELECT 
    sch.name AS table_schema,
    tab1.name AS table_name,
    col1.name AS column_name,
    obj.name AS fk_name,
	sch.name AS foreign_table_schema,
    tab2.name AS foreign_table_name,
    col2.name AS foreign_column_name
FROM sys.foreign_key_columns fkc
INNER JOIN sys.objects obj
    ON obj.object_id = fkc.constraint_object_id
INNER JOIN sys.tables tab1
    ON tab1.object_id = fkc.parent_object_id
INNER JOIN sys.schemas sch
    ON tab1.schema_id = sch.schema_id
INNER JOIN sys.columns col1
    ON col1.column_id = parent_column_id AND col1.object_id = tab1.object_id
INNER JOIN sys.tables tab2
    ON tab2.object_id = fkc.referenced_object_id
INNER JOIN sys.columns col2
    ON col2.column_id = referenced_column_id AND col2.object_id = tab2.object_id
`);
    return result.recordset;
  }

  public async getPrimaryKeys(): Promise<PrimaryKeyResult[]> {
    const result = await sql.query<ForeignKeyResult>(this.QUERY_PRIMARY_KEYS);
    return result.recordset;
  }

  public getJdbcPath(): string {
    return "mssql-jdbc-9.4.1.jre8.jar";
  }
  public getDbmsName(): DbmsType {
    return DbmsType.mssql;
  }
}
