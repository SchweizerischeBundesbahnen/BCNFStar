import IAttribute from "@/definitions/IAttribute";
import IRelationship from "@/definitions/IRelationship";
import ITablePage from "@/definitions/ITablePage";

export type SchemaQueryRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
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

export type PrimaryKeyResult = {
  table_schema: string;
  table_name: string;
  column_name: string;
};

export enum DbmsType {
  mssql = "mssql",
  postgres = "postgres",
}

export default abstract class SqlUtils {
  abstract init(): void;
  public abstract getSchema(): Promise<Array<SchemaQueryRow>>;
  public abstract getTablePage(
    tablename: string,
    schemaname: string,
    offset: number,
    limit: number
  ): Promise<ITablePage>;
  public abstract getTableRowCount(
    table: string,
    schema: string
  ): Promise<number>;

  public abstract tableExistsInSchema(
    schema: string,
    table: string
  ): Promise<boolean>;

  protected readonly QUERY_PRIMARY_KEYS: string = `
    SELECT 
      ku.TABLE_SCHEMA As table_schema,
      KU.table_name as table_name,
      column_name as column_name
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS TC 
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KU
      ON TC.CONSTRAINT_TYPE = 'PRIMARY KEY' 
      AND TC.CONSTRAINT_NAME = KU.CONSTRAINT_NAME`;

  public abstract getForeignKeys(): Promise<ForeignKeyResult[]>;
  public abstract getPrimaryKeys(): Promise<PrimaryKeyResult[]>;
  public abstract getJdbcPath(): string;
  public abstract getDbmsName(): DbmsType;

  public abstract getViolatingRowsForFD(
    schema: string,
    table: string,
    lhs: Array<string>,
    rhs: Array<string>,
    offset: number,
    limit: number
  ): Promise<ITablePage>;

  protected violatingRowsForFD_SQL(
    schema: string,
    table: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): string {
    return `
SELECT ${lhs.concat(rhs).join(",")}
FROM ${schema}.${table} AS x 
WHERE EXISTS (
	SELECT 1 FROM (
		SELECT ${lhs.join(",")} FROM (
			SELECT ${[...new Set(lhs.concat(rhs))].join(",")}
			FROM ${schema}.${table} 
			GROUP BY ${[...new Set(lhs.concat(rhs))].join(",")}
		) AS Z  -- removes duplicates
		GROUP BY ${lhs.join(",")} 
		HAVING COUNT(1) > 1 -- this is violating the fd, as duplicates are removed but the lhs still occures multiple times -> different rhs
	) AS Y WHERE ${lhs.map((c) => `X.${c} = Y.${c}`).join(" AND ")}
) 
    `;
  }

  public abstract getViolatingRowsForFDCount(
    schema: string,
    table: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): Promise<number>;

  public abstract SQL_CREATE_SCHEMA(newSchema: string): string;
  public abstract SQL_DROP_TABLE_IF_EXISTS(
    newSchema: string,
    newTable: string
  ): string;
  public abstract SQL_CREATE_TABLE(
    attributes: IAttribute[],
    primaryKey: string[],
    newSchema,
    newTable
  ): string;

  public SQL_INSERT_DATA(
    attributes: IAttribute[],
    sourceTables: string[],
    relationships: IRelationship[],
    newSchema: string,
    newTable: string
  ): string {
    return `INSERT INTO ${newSchema}.${newTable} SELECT DISTINCT ${attributes
      .map((attr) => `${attr.table}.${attr.name}`)
      .join(", ")} FROM ${sourceTables.join(", ")}
    ${this.where(relationships)};
    `;
  }

  public where(relationships: IRelationship[]): string {
    if (relationships.length == 0) return "";
    return `WHERE ${relationships
      .map((relationship) =>
        relationship.columnRelationships
          .map(
            (column) =>
              `${relationship.referencing.schemaName}.${relationship.referencing.name}.${column.referencingColumn} = ${relationship.referenced.schemaName}.${relationship.referenced.name}.${column.referencedColumn}`
          )
          .join(" AND ")
      )
      .join(" AND ")}`;
  }

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
