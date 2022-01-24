import sql from "mssql";
import { env } from "process";
import SqlUtils, { ForeignKeyResult, SchemaQueryRow } from "./SqlUtils";
import { EOL } from "os";

type Attribute = {
  type: string;
  column_name: string;
};

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

  public async attributesExistInTable(
    attributeNames: string[],
    schema: string,
    table: string
  ): Promise<boolean> {
    const ps = new sql.PreparedStatement();
    ps.input("table", sql.NVarChar);
    ps.input("schema", sql.NVarChar);

    await ps.prepare(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @table"
    );
    const result = await ps.execute({ schema, table });
    return attributeNames.every((name) =>
      result.recordset.map((e) => e.COLUMN_NAME).includes(name)
    );
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
    console.log(result);
    return result.recordset;
  }

  public override SQL_CREATE_SCHEMA(newSchema: string): string {
    return `IF NOT EXISTS ( SELECT  *
      FROM    sys.schemas
      WHERE   name = N'${newSchema}' )
EXEC('CREATE SCHEMA [${newSchema}]');
GO`;
  }
  public override SQL_DROP_TABLE_IF_EXISTS(newSchema, newTable): string {
    return `DROP TABLE IF EXISTS ${newSchema}.${newTable}; GO`;
  }
  public async SQL_CREATE_TABLE(
    attributeNames,
    primaryKey: string[],
    originSchema,
    originTable,
    newSchema,
    newTable
  ): Promise<string> {
    const copy: string[] = [];
    const datatypes: Attribute[] = await this.datatypeOf(
      originSchema,
      originTable,
      ""
    );
    // console.log("datatypes", datatypes);
    for (let i: number = 0; i < attributeNames.length; i++) {
      copy[i] =
        attributeNames[i] +
        " " +
        datatypes
          .filter((e) => e.column_name == attributeNames[i])
          .map((e) => e.type)[0] +
        (primaryKey.includes(attributeNames[i]) ? " NOT NULL " : " NULL");
    }
    const attributeString: string = copy.join(",");
    return `CREATE TABLE ${newSchema}.${newTable} (${attributeString}) GO`;
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
    FOREIGN KEY (${referencingColumns.join(", ")})
    REFERENCES ${referencedSchema}.${referencedTable} (${referencedColumns.join(
      ", "
    )});
`;
  }

  public async datatypeOf(
    schema: string,
    table: string,
    attribute: string
  ): Promise<Attribute[]> {
    const ps = new sql.PreparedStatement();
    ps.input("schema", sql.NVarChar);
    ps.input("table", sql.NVarChar);
    await ps.prepare(
      `SELECT 
    [column_name] = c.name,
    [type]         = 
       CASE 
         WHEN tp.[name] IN ('varchar', 'char') THEN tp.[name] + '(' + IIF(c.max_length = -1, 'max', CAST(c.max_length AS VARCHAR(25))) + ')' 
         WHEN tp.[name] IN ('nvarchar','nchar') THEN tp.[name] + '(' + IIF(c.max_length = -1, 'max', CAST(c.max_length / 2 AS VARCHAR(25)))+ ')'      
         WHEN tp.[name] IN ('decimal', 'numeric') THEN tp.[name] + '(' + CAST(c.[precision] AS VARCHAR(25)) + ', ' + CAST(c.[scale] AS VARCHAR(25)) + ')'
         WHEN tp.[name] IN ('datetime2') THEN tp.[name] + '(' + CAST(c.[scale] AS VARCHAR(25)) + ')'
         ELSE tp.[name]
       END
   FROM sys.tables t 
   JOIN sys.schemas s ON t.schema_id = s.schema_id
   JOIN sys.columns c ON t.object_id = c.object_id
   JOIN sys.types tp ON c.user_type_id = tp.user_type_id
   WHERE s.[name] = @schema AND t.[name] = @table`
    );
    const result = await ps.execute({ schema, table });

    return result.recordset as Attribute[];
  }

  public override SQL_INSERT_DATA(
    attributeNames,
    originSchema,
    originTable,
    newSchema,
    newTable
  ): string {
    return `INSERT INTO ${newSchema}.${newTable} SELECT DISTINCT ${attributeNames.join(
      ", "
    )} FROM ${originSchema}.${originTable}`;
  }
  public override SQL_ADD_PRIMARY_KEY(newSchema, newTable, primaryKey): string {
    return `ALTER TABLE ${newSchema}.${newTable} ADD PRIMARY KEY (${primaryKey.join(
      ", "
    )});`;
  }

  public getJdbcPath(): String {
    return "mssql-jdbc-9.4.1.jre8.jar";
  }
}
