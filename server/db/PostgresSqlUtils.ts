import SqlUtils, {
  ForeignKeyResult,
  SchemaQueryRow,
  TableHead,
} from "./SqlUtils";
import IAttribute from "@/definitions/IAttribute";
import { Pool, QueryConfig, PoolConfig } from "pg";

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

  protected pool: Pool;
  init(): void {
    this.pool = new Pool(this.config);
  }
  public async getSchema(): Promise<SchemaQueryRow[]> {
    const client = await this.pool.connect();
    const query_result = await client.query<SchemaQueryRow>(
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

  public async attributesExistInTable(
    attributeNames: string[],
    originSchema: string,
    originTable: string
  ): Promise<boolean> {
    const client = await this.pool.connect();
    const query_result = await client.query<{
      column_name: string;
    }>(
      `SELECT column_name 
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2;`,
      [originSchema, originTable]
    );
    const originTableColumns = query_result.rows.map((row) => row.column_name);
    return attributeNames.every((name) => originTableColumns.includes(name));
  }

  public async schemaExistsInDatabase(schema: string): Promise<boolean> {
    const client = await this.pool.connect();
    return client
      .query(
        `SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`,
        [schema]
      )
      .then((queryResult) => queryResult.rowCount > 0);
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

  public override SQL_CREATE_SCHEMA(newSchema: string): string {
    return `CREATE SCHEMA IF NOT EXISTS ${newSchema};`;
  }
  public override SQL_DROP_TABLE_IF_EXISTS(newSchema, newTable): string {
    return `DROP TABLE IF EXISTS ${newSchema}.${newTable};`;
  }
  public SQL_CREATE_TABLE(
    attributes: IAttribute[],
    primaryKey: string[],
    newSchema,
    newTable
  ): string {
    // return `CREATE TABLE ${newSchema}.${newTable} AS SELECT DISTINCT
    // ${attributeNames.map((a) => '"' + a + '"').join(", ")} FROM ${originSchema}.${originTable};`;

    return "";
  }
  public override SQL_INSERT_DATA(
    attributeNames,
    originSchema,
    originTable,
    newSchema,
    newTable
  ): string {
    return "";
  }
  public override SQL_ADD_PRIMARY_KEY(newSchema, newTable, primaryKey): string {
    return `ALTER TABLE ${newSchema}.${newTable} ADD PRIMARY KEY (${primaryKey
      .map((a) => '"' + a + '"')
      .join(", ")});`;
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
    return `ALTER TABLE ${referencingSchema}.${referencingTable} 
    ADD CONSTRAINT ${constraintName}
    FOREIGN KEY (${referencingColumns.map((a) => '"' + a + '"').join(", ")})
    REFERENCES ${referencedSchema}.${referencedTable} (${referencedColumns
      .map((a) => '"' + a + '"')
      .join(", ")});
`;
  }

  public getJdbcPath(): String {
    return "postgresql-42.3.1.jar";
  }
}
