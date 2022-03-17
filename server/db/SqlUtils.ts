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
  public abstract getForeignKeys(): Promise<ForeignKeyResult[]>;
  public abstract getJdbcPath(): string;
  public abstract getDbmsName(): string;
}
