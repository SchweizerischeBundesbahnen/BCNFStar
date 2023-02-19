import ITablePage from "@/definitions/ITablePage";
import sql from "mssql";
import {
  DbmsType,
  SchemaQueryRow,
} from "./SqlUtils";
import IRowCounts from "@/definitions/IRowCounts";
import MsSqlUtils from "./MsSqlUtils";

// WARNING: make sure to always unprepare a PreparedStatement after everything's done
// (or failed*), otherwise it will eternally use one of the connections from the pool and
// prevent new queries
// * this means: use try-finally

var ISOLATION_LEVEL = require('tedious').ISOLATION_LEVEL;

export default class SynapseSqlUtils extends MsSqlUtils {
  public constructor(
    server: string,
    database: string,
    user: string,
    password: string,
    port: number = 1433
  ) {
    super(server, database, user, password, port, {
      encrypt: true, // for azure
      enableArithAbort: true,
      connectionIsolationLevel: ISOLATION_LEVEL.READ_UNCOMMITTED
    },);
  };

  public async getSchema(): Promise<Array<SchemaQueryRow>> {
    const result = await sql.query<SchemaQueryRow>(`SELECT 
      t.name as table_name, 
      s.name as [table_schema],
      c.name as [column_name] ,
           CASE 
             WHEN tp.[name] IN ('varchar', 'char') THEN tp.[name] + '(' + (SELECT CASE WHEN c.max_length = -1 THEN 'max' ELSE CAST(c.max_length AS VARCHAR(25)) END) + ')' 
             WHEN tp.[name] IN ('nvarchar','nchar') THEN tp.[name] + '(' + (SELECT CASE WHEN c.max_length = -1 THEN 'max' ELSE CAST(c.max_length / 2 AS VARCHAR(25)) END) + ')'      
             WHEN tp.[name] IN ('decimal', 'numeric') THEN tp.[name] + '(' + CAST(c.[precision] AS VARCHAR(25)) + ', ' + CAST(c.[scale] AS VARCHAR(25)) + ')'
             WHEN tp.[name] IN ('datetime2') THEN tp.[name] + '(' + CAST(c.[scale] AS VARCHAR(25)) + ')'
             ELSE tp.[name]
           END AS [data_type],
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
      const result = await sql.query<any>(`SELECT TOP (${limit}) *
        FROM ( SELECT ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS RowNum, *
                FROM [${schemaname}].[${tablename}] AS tr) AS data
                WHERE ${offset} < RowNum
                ORDER BY (SELECT NULL)`
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
  ): Promise<IRowCounts> {
    const tableExists = await this.tableExistsInSchema(schema, table);
    if (tableExists) {
      const queryResult = await sql.query(`SELECT
      SUM(sPTN.Rows) AS count
 FROM
        sys.objects AS sOBJ
        INNER JOIN sys.partitions AS sPTN ON sOBJ.object_id = sPTN.object_id
 WHERE
        sOBJ.type = 'U'
        AND sOBJ.is_ms_shipped = 0x0
        AND index_id < 2 
      AND sOBJ.name = '${table}'
      AND SCHEMA_NAME(sOBJ.schema_id) = '${schema}'`);
      const count = +queryResult.recordset[0].count;
      return { entries: count, groups: count };
    } else {
      throw {
        error: "Table or schema does not exist in database",
      };
    }
  }


  public getDbmsName(): DbmsType {
    return DbmsType.synapse;
  }
}
