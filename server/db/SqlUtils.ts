import { IColumnRelationship } from "../definitions/IRelationship";
import ITablePage from "@/definitions/ITablePage";
import ITable from "@/definitions/ITable";

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

  public abstract UNIVERSAL_DATATYPE(): string;

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
  public abstract getDbmsName(): "mssql" | "postgres";

  public abstract getViolatingRowsForFD(
    schema: string,
    table: string,
    lhs: Array<string>,
    rhs: Array<string>,
    offset: number,
    limit: number
  ): Promise<ITablePage>;

  public abstract getViolatingRowsForSuggestedINDCount(
    referencingTable: ITable,
    referencedTable: ITable,
    columnRelationships: IColumnRelationship[]
  ): Promise<number>;

  public abstract getViolatingRowsForSuggestedIND(
    referencingTable: ITable,
    referencedTable: ITable,
    columnRelationships: IColumnRelationship[],
    offset: number,
    limit: number
  ): Promise<ITablePage>;

  /**
   * Because of the LEFT OUTER JOIN and the WHERE-Clause only those rows from the referencing table are selected, which are missing
   * in the referenced table and are therefore violating the Inclusion-Dependency.
   */
  protected violatingRowsForSuggestedIND_SQL(
    referencingTable: ITable,
    referencedTable: ITable,
    columnRelationships: IColumnRelationship[]
  ): string {
    return `
    SELECT ${columnRelationships
      .map((cc) => `X.${cc.referencingColumn}`)
      .join(",")}, COUNT(1) AS Count
    FROM ${referencingTable.schemaName}.${referencingTable.name} AS X
    LEFT OUTER JOIN ${referencedTable.schemaName}.${referencedTable.name} AS Y 
      ON ${columnRelationships
        .map(
          (cc) =>
            `CAST(X.${
              cc.referencingColumn
            } AS ${this.UNIVERSAL_DATATYPE()}) = CAST(Y.${
              cc.referencedColumn
            } AS ${this.UNIVERSAL_DATATYPE()})`
        )
        .join(" AND ")}
    WHERE Y.${columnRelationships[0].referencedColumn} IS NULL
    GROUP BY ${columnRelationships
      .map((cc) => `X.${cc.referencingColumn}`)
      .join(",")}
    `;
  }

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
}
