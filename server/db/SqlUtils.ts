export type SchemaQueryRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  table_schema: string;
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
}
