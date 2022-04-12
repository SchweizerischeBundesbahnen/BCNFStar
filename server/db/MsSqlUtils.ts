import ITableHead from "@/definitions/ITableHead";
import { pseudoRandomBytes } from "crypto";
import sql from "mssql";
import SqlUtils, {
  DbmsType,
  ForeignKeyResult,
  PrimaryKeyResult,
  SchemaQueryRow,
} from "./SqlUtils";
import IAttribute from "@/definitions/IAttribute";

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
  public async getTableHead(
    tablename: string,
    schemaname: string,
    limit: number
  ): Promise<ITableHead> {
    const tableExists = await this.tableExistsInSchema(schemaname, tablename);
    if (tableExists) {
      const result: sql.IResult<any> = await sql.query(
        `SELECT TOP (${limit}) * FROM [${schemaname}].[${tablename}]`
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
      const query_result = await sql.query(
        `SELECT COUNT(*) as count FROM ${schema}.${table}`
      );
      return query_result.recordset[0].count;
    } else {
      throw {
        error: "Table or schema does not exist in database",
      };
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
  public getDbmsName(): DbmsType {
    return DbmsType.mssql;
  }
}
