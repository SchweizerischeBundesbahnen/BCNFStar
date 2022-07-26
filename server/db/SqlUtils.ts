import IRelationship, {
  IColumnRelationship,
} from "../definitions/IRelationship";
import ITablePage from "@/definitions/ITablePage";
import ITable from "@/definitions/ITable";
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

export type SchemaQueryRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  table_schema: string;
};

export type ForeignKeyResult = {
  fk_name: string;
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
  ): Promise<IRowCounts>;

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
  public abstract getDbmsName(): DbmsType;

  public abstract getDatatypes(): Promise<string[]>;

  public abstract testKeyUnionability(
    t: IRequestBodyUnionedKeys
  ): Promise<KeyUnionability>;

  public abstract escape(str: string): string;

  public generateColumnString(columns: string[]): string {
    return columns.map((c) => this.escape(c)).join(", ");
  }

  public dropTable_SQL(tableName: string): string {
    return `DROP TABLE IF EXISTS ${tableName};`;
  }

  public testTypeCastingSql(tc: IRequestBodyTypeCasting): string {
    const tableString = `${this.escape(tc.schema)}.${this.escape(tc.table)}`;
    // Casting twice in the second part of the SQL is necessary to recognize informationloss (float -> int)
    return `
    SELECT ${this.escape(tc.column)} FROM ${tableString} 
    EXCEPT 
    SELECT CAST(CAST(${this.escape(tc.column)} AS ${tc.targetDatatype}) AS ${
      tc.currentDatatype
    }) FROM ${tableString} 
    `;
  }

  /** Expects to get two keys respectively. Otherwise, this Sql won't work correctly, i.e. return wrong results
   * The SQL calculates the number of rows of the unioned tables and the number of rows of the unioned key-columns and takes the difference
   * difference > 0 means, that the key is invalid as the unioned table contains different rows with the same key. (SQL-UNION is implemented as a SET-Operation)
   */
  public testKeyUnionabilitySql(uk: IRequestBodyUnionedKeys): string {
    const table1Identifier: string = `${this.escape(
      uk.key1.table_schema
    )}.${this.escape(uk.key1.table_name)}`;
    const table2Identifier: string = `${this.escape(
      uk.key2.table_schema
    )}.${this.escape(uk.key2.table_name)}`;

    return `
  SELECT 
    (SELECT COUNT(*) as unionedCount
    FROM
    (
    SELECT ${this.generateColumnString(
      uk.unionedColumns[0]
    )} FROM ${table1Identifier} 
    UNION
    SELECT ${this.generateColumnString(
      uk.unionedColumns[1]
    )} FROM ${table2Identifier} 
    ) as unionedCount)
  -
    (SELECT COUNT(*) as unionedCountKey
    FROM
    (
      SELECT ${this.generateColumnString(
        uk.key1.attributes
      )} FROM ${table1Identifier}
      UNION
      SELECT ${this.generateColumnString(
        uk.key2.attributes
      )} FROM ${table2Identifier}
    ) as unionedcount) as count
`;
  }

  public abstract testTypeCasting(
    s: IRequestBodyTypeCasting
  ): Promise<TypeCasting>;

  public abstract getViolatingRowsForFD(
    sql: string,
    lhs: Array<string>,
    rhs: Array<string>,
    offset: number,
    limit: number
  ): Promise<ITablePage>;

  public abstract getViolatingRowsForSuggestedINDCount(
    referencingTableSql: string,
    referencedTableSql: string,
    columnRelationships: IColumnRelationship[]
  ): Promise<IRowCounts>;

  public abstract getViolatingRowsForSuggestedIND(
    referencingTableSql: string,
    referencedTableSql: string,
    columnRelationships: IColumnRelationship[],
    offset: number,
    limit: number
  ): Promise<ITablePage>;

  /**
   * Because of the LEFT OUTER JOIN and the WHERE-Clause only those rows from the referencing table are selected, which are missing
   * in the referenced table and are therefore violating the Inclusion-Dependency.
   */
  protected violatingRowsForSuggestedIND_SQL(
    referencingTable: string,
    referencedTable: string,
    columnRelationships: IColumnRelationship[]
  ): string {
    return `
    SELECT ${columnRelationships
      .map((cc) => `X.${cc.referencingColumn}`)
      .join(",")}, COUNT(1) AS Count
    FROM ${referencingTable} AS X
    LEFT OUTER JOIN ${referencedTable} AS Y 
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

  public abstract tempTableName(name: string): string;

  /**
   * @param Sql The Sql that queries the information the temp-table should contain
   * @param name The name of the temp-table. Relevant for multiple temp-table in one query
   */
  public abstract tempTableScripts(Sql: string, name: string): ITemptableScript;

  /**
   * @param sql The Sql that queries the information the temp-table should contain
   * @param name The name of the temp-table. Relevant for multiple temp-table in one query
   */
  public abstract createTempTable(sql: string): Promise<string>;

  public abstract dropTempTable(name: string): Promise<void>;

  protected randomName(): string {
    return (Math.random() + 1).toString(36).substring(7);
  }

  protected violatingRowsForFD_SQL(
    tableName: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): string {
    return `
SELECT ${lhs.concat(rhs).join(",")}, COUNT(*) AS Count
FROM ${tableName} AS x 
WHERE EXISTS (
	SELECT 1 FROM (
		SELECT ${lhs.join(",")} FROM (
			SELECT ${[...new Set(lhs.concat(rhs))].join(",")}
			FROM ${tableName} 
			GROUP BY ${[...new Set(lhs.concat(rhs))].join(",")}
		) AS Z  -- removes duplicates
		GROUP BY ${lhs.join(",")} 
		HAVING COUNT(1) > 1 -- this is violating the fd, as duplicates are removed but the lhs still occures multiple times -> different rhs
	) AS Y WHERE ${lhs.map((c) => `X.${c} = Y.${c}`).join(" AND ")}
) 
GROUP BY ${lhs.concat(rhs).join(",")}
    `;
  }

  public abstract getViolatingRowsForFDCount(
    _sql: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): Promise<IRowCounts>;

  public getViolatingRowsForFDCount_Sql(tablename: string, lhs, rhs) {
    return `
    SELECT COALESCE (SUM(Count), 0) as entries, COALESCE (COUNT(*),0) as groups FROM (
      ${this.violatingRowsForFD_SQL(tablename, lhs, rhs)} 
      ) AS X `;
  }

  public getViolatingRowsForINDCount_Sql(
    referencingTable: string,
    referencedTable: string,
    columnRelationships: IColumnRelationship[]
  ) {
    return `SELECT COALESCE(SUM(Count), 0) as entries, COALESCE(COUNT(*),0) as groups 
    FROM ( ${this.violatingRowsForSuggestedIND_SQL(
      referencingTable,
      referencedTable,
      columnRelationships
    )}
    ) AS X`;
  }
}
