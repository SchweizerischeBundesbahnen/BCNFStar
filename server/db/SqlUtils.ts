export type SchemaQueryRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  table_schema: string;
};

export type ForeignKeyResult = {
  table_schema: string;
  table_name: string;
  column_name: string;
  foreign_table_schema: string;
  foreign_table_name: string;
  foreign_column_name: string;
};

export type TableHead = {
  data: Array<Record<string, any>>;
  columns: Array<string>;
};

export default abstract class SqlUtils {
  abstract init(): void;
  public abstract getSchema(): Promise<Array<SchemaQueryRow>>;
  public abstract getTableHead(
    tablename: string,
    tableschema: string
  ): Promise<TableHead | { error: string }>;

  public abstract tableExistsInSchema(
    schema: string,
    table: string
  ): Promise<boolean>;

  public abstract schemaExistsInDatabase(schema: string): Promise<boolean>;

  public abstract attributesExistInTable(
    attributeNames: string[],
    schema: string,
    table: string
  ): Promise<boolean>;

  public abstract getForeignKeys(): Promise<ForeignKeyResult[]>;
  public abstract getJdbcPath(): String;

  public abstract SQL_CREATE_SCHEMA(newSchema: string): string;
  public abstract SQL_DROP_TABLE_IF_EXISTS(
    newSchema: string,
    newTable: string
  ): string;
  public abstract SQL_CREATE_TABLE(
    attributeNames: string[],
    originSchema: string,
    originTable: string,
    newSchema: string,
    newTable: string
  ): Promise<string>;
  public abstract SQL_INSERT_DATA(
    attributeNames: string[],
    originSchema: string,
    originTable: string,
    newSchema: string,
    newTable: string
  ): string;
  public abstract SQL_ADD_PRIMARY_KEY(
    newSchema: string,
    newTable: string,
    primaryKey: string[]
  ): string;
  public abstract SQL_FOREIGN_KEY(
    constraintName: string,
    referencingSchema: string,
    referencingTable: string,
    referencingColumns: string[],
    referencedSchema: string,
    referencedTable: string,
    referencedColumns: string[]
  ): string;
}
