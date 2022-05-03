import ITablePage from "@/definitions/ITablePage";
import { pseudoRandomBytes } from "crypto";
import sql from "mssql";
import SqlUtils, {
  ForeignKeyResult,
  PrimaryKeyResult,
  SchemaQueryRow,
} from "./SqlUtils";
import IAttribute from "../definitions/IAttribute";
import ITable from "@/definitions/ITable";
import { IColumnRelationship } from "@/definitions/IRelationship";

// WARNING: make sure to always unprepare a PreparedStatement after everything's done
// (or failed*), otherwise it will eternally use one of the connections from the pool and
// prevent new queries
// * this means: use try-finally

const suffix = "\nGO\n";
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

  public UNIVERSAL_DATATYPE(): string {
    return "varchar(max)";
  }

  public async getSchema(): Promise<Array<SchemaQueryRow>> {
    const result: sql.IResult<SchemaQueryRow> = await sql.query(`SELECT 
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
      const result: sql.IResult<any> = await sql.query(
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

  public async getTableRowCount(
    table: string,
    schema: string
  ): Promise<number> {
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
      return +queryResult.recordset[0].count;
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

    const result: sql.IResult<any> = await sql.query(
      this.violatingRowsForFD_SQL(schema, table, lhs, rhs) +
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

    const result: sql.IResult<any> = await sql.query(
      this.violatingRowsForSuggestedIND_SQL(
        referencingTable,
        referencedTable,
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

    console.log(
      this.violatingRowsForSuggestedIND_SQL(
        referencingTable,
        referencedTable,
        columnRelationships
      )
    );

    const result: sql.IResult<any> = await sql.query(
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
    return result.recordset[0].count;
  }

  public async getViolatingRowsForFDCount(
    schema: string,
    table: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): Promise<number> {
    if (!this.columnsExistInTable(schema, table, lhs.concat(rhs))) {
      throw Error("Columns don't exist in table.");
    }

    const result: sql.IResult<any> = await sql.query(
      `SELECT COUNT (*) as count FROM 
      (
      ${this.violatingRowsForFD_SQL(schema, table, lhs, rhs)} 
      ) AS X
      `
    );
    return result.recordset[0].count;
  }

  public async getForeignKeys(): Promise<ForeignKeyResult[]> {
    const result = await sql.query<ForeignKeyResult>(`
  SELECT 
    sch.name AS table_schema,
    tab1.name AS table_name,
    col1.name AS column_name,
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

  public override SQL_CREATE_SCHEMA(newSchema: string): string {
    return `IF NOT EXISTS ( SELECT  *
      FROM    sys.schemas
      WHERE   name = N'${newSchema}' )
EXEC('CREATE SCHEMA [${newSchema}]'); ${suffix}`;
  }
  public override SQL_DROP_TABLE_IF_EXISTS(
    newSchema: string,
    newTable: string
  ): string {
    return `DROP TABLE IF EXISTS ${newSchema}.${newTable}; ${suffix}`;
  }
  public SQL_CREATE_TABLE(
    attributes: IAttribute[],
    primaryKey: string[],
    newSchema: string,
    newTable: string
  ): string {
    const attributeString: string = attributes
      .map(
        (attribute) =>
          attribute.name +
          " " +
          attribute.dataType +
          (primaryKey.includes(attribute.name) || attribute.nullable == false
            ? " NOT NULL "
            : " NULL")
      )
      .join(",");
    console.log(primaryKey);
    return `CREATE TABLE ${newSchema}.${newTable} (${attributeString}) ${suffix}`;
  }

  public override SQL_FOREIGN_KEY(
    constraintName: string,
    referencingSchema: string,
    referencingTable: string,
    referencingColumns: string[],
    referencedSchema: string,
    referencedTable: string,
    referencedColumns: string[]
  ): string {
    return `
    ALTER TABLE ${referencingSchema}.${referencingTable} 
    ADD CONSTRAINT ${constraintName}
    FOREIGN KEY (${this.generateColumnString(referencingColumns)})
    REFERENCES ${referencedSchema}.${referencedTable} (${this.generateColumnString(
      referencedColumns
    )});
`;
  }

  public override SQL_ADD_PRIMARY_KEY(newSchema, newTable, primaryKey): string {
    return `ALTER TABLE ${newSchema}.${newTable} ADD PRIMARY KEY (${this.generateColumnString(
      primaryKey
    )});`;
  }

  private generateColumnString(columns: string[]) {
    return columns.map((c) => `[${c}]`).join(", ");
  }

  public getJdbcPath(): string {
    return "mssql-jdbc-9.4.1.jre8.jar";
  }
  public getDbmsName(): "mssql" | "postgres" {
    return "mssql";
  }
}
