import ITablePage from "@/definitions/ITablePage";
const hive = require('hive-driver');
const { TCLIService, TCLIService_types } = hive.thrift;
const client = new hive.HiveClient(
    TCLIService,
    TCLIService_types
);
const utils = new hive.HiveUtils(
    TCLIService_types
);

import SqlUtils, {
  DbmsType,
  ForeignKeyResult,
  PrimaryKeyResult,
  SchemaQueryRow,
  SchemaRowsQueryRow,
} from "./SqlUtils";
import ITable from "@/definitions/ITable";
import { IColumnRelationship } from "@/definitions/IRelationship";
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
import { Console } from "console";
import { Dictionary, List } from "lodash";
import { HiveClient } from "hive-driver";
import HiveDriver from "hive-driver/dist/hive/HiveDriver";
import GetResultSetMetadataCommand from "hive-driver/dist/hive/Commands/GetResultSetMetadataCommand";
import { privateEncrypt } from "crypto";

// WARNING: make sure to always unprepare a PreparedStatement after everything's done
// (or failed*), otherwise it will eternally use one of the connections from the pool and
// prevent new queries
// * this means: use try-finally


export default class SparkSqlUtils extends SqlUtils {
  private conf=[];
  public constructor(
    server: string,
    user: string,
    password: string,
    port: number = 10009
  ) {
    super();
    this.conf=[{
      host: server,
      port: port
        },
        new hive.connections.TcpConnection(),
        new hive.auth.PlainTcpAuthentication({
      username: user,
      password: password})]
  };

  public async init() {}

  public UNIVERSAL_DATATYPE(): string {
    return "STRING";
  }


  private async executeStatement(statement){
    return await client.connect(...this.conf).then(async client => {
        return await client.openSession({
            client_protocol: TCLIService_types.TProtocolVersion.HIVE_CLI_SERVICE_PROTOCOL_V10}).then(async session => {
              
              const result = await session.executeStatement(statement).then(this.handleOperation, { runAsync: true });
              session.close();
              return result;
        })
    })
  };

  private handleOperation = (operation) => {
    return utils.waitUntilReady(operation, false, () => {})
    /*return utils.waitUntilReady(operation, true, (stateResponse) => {
        console.log("Before null?")
        console.log(stateResponse.taskStatus);
        console.log("After null?")
    })*/
    .then((operation) => {
        return utils.fetchAll(operation);
    })
    .then((operation) => {
        return operation.close();
    })
    .then(() => {
        return utils.getResult(operation).getValue();
    })
  };


  /** The #{name} is syntax-sugar in mssql to create a temp table. It is dropped after the session ends by the dbms.
   */
  public override tempTableName(name: string): string {
    return `#${name}`;
  }

  public tempTableScripts(Sql: string): ITemptableScript { //TODO 2 Expressions!
    const name: string = this.randomName();
    const ITemptableScript: ITemptableScript = {
      name: this.tempTableName(name),
      createScript: `
      DROP TABLE IF EXISTS ${this.tempTableName(name)}; 
      SELECT * INTO ${this.tempTableName(name)} FROM (${Sql}) AS X;
      `,
    };
    return ITemptableScript;
  }

  public override async createTempTable(_sql: string): Promise<string> {
    /*const x: ITemptableScript = this.tempTableScripts(_sql);
    const createTableOperation = await this.session.executeStatement(x.createScript);
    await utils.waitUntilReady(createTableOperation, false, () => {});
    await createTableOperation.close();
    return x.name;*/
    return new Promise<string>((resolve, reject) => {
      
    })
  }

  public override async dropTempTable(name: string): Promise<void> {
    /*const dropTableOperation = await this.session.executeStatement(this.dropTable_SQL(name));
    await utils.waitUntilReady(dropTableOperation, false, () => {});
    await dropTableOperation.close();*/
    return new Promise<void>((resolve, reject) => {
      
    })
  }

  public async getSchema(): Promise<SchemaQueryRow[]> {

      const result: Promise<SchemaQueryRow[]> = await this.executeStatement(
          "SELECT table_name, column_name, data_type, is_nullable, table_schema FROM metadata.column_meta"
        );
      
      return result
    }


  public async getTablePage(
    tablename: string,
    schemaname: string,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    const tableExists = await this.tableExistsInSchema(schemaname, tablename);
    if (tableExists) {
        const result  = await this.executeStatement(`SELECT * FROM ( SELECT *, ROW_NUMBER() OVER 
        (ORDER BY (SELECT NULL)) AS RowNum FROM ${schemaname}.${tablename}) AS tr 
        WHERE ${offset} < RowNum ORDER BY (SELECT NULL) LIMIT ${limit};`
      );
      return {
        rows: result,
        attributes: Object.keys(result[0]),
      };
    } else {
      throw { error: "Table or schema doesn't exist" };

    }
  }

  /** The "null"-check is relevant for unionability-checks. */
  public override escape(str: string): string {
    if (str.toLowerCase() == "null") return "null";
    return `[${str}]`;
  }

  public override async testKeyUnionability(
    t: IRequestBodyUnionedKeys
  ): Promise<KeyUnionability> {
    /*
    const _sql: string = this.testKeyUnionabilitySql(t);
    const result: sql.IResult<any> = await sql.query(_sql);
    if (result.recordset[0].count == 0) return KeyUnionability.allowed;
    return KeyUnionability.forbidden;*/
    return new Promise<KeyUnionability>((resolve, reject) => {
      
    })
  }

  public override async getDatatypes(): Promise<string[]> {
    /*const _sql: string = "select name from sys.types";
    const result: sql.IResult<any> = await sql.query<{ name: string }>(_sql);
    return result.recordset.map((record) => record.name);*/
    return new Promise<string[]>((resolve, reject) => {
      
    })
  }

  public override async testTypeCasting(
    s: IRequestBodyTypeCasting
  ): Promise<TypeCasting> {
    /*
    const _sql: string = this.testTypeCastingSql(s);

    try {
      const result: sql.IResult<any> = await sql.query(_sql);
      if (result.recordset.length == 0) return TypeCasting.allowed;
      return TypeCasting.informationloss;
    } catch (Error) {
      return TypeCasting.forbidden;
    }*/
    return new Promise<TypeCasting>((resolve, reject) => {
      
    })
  }

  public async getTableRowCount(
    table: string,
    schema: string
  ): Promise<IRowCounts> {
      //NOT IMPLEMENTED!!!!!
      return new Promise<IRowCounts>((resolve, reject) => {
      
    })
  }


public async getTableRowCounts(): Promise<Array<SchemaRowsQueryRow>> {

      const result: Promise<Array<SchemaRowsQueryRow>> = await this.executeStatement(`SELECT
        table_schema,
        table_name,
        count 
        FROM metadata.row_count`);

      return result;
}


  /**
   * This also checks if table and schema exist in database.
   */
  public async columnsExistInTable(
    schema: string,
    table: string,
    columns: Array<string>
  ): Promise<boolean> {
    /*
    const ps = new sql.PreparedStatement();
    try {
      ps.input("schema", sql.NVarChar);
      ps.input("table", sql.NVarChar);

      await ps.prepare(
        "select column_name from INFORMATION_SCHEMA.COLUMNS WHERE table_schema = @schema AND table_name = @table"
      );
      const result: sql.IResult<string> = await ps.execute({ schema, table });
      return columns.every((c) =>
        result.recordset
          .map((r) => r.toString().toLowerCase())
          .includes(c.toLowerCase())
      );
    } catch (e) {
      console.log(e);
      throw Error("Error while checking if table contains columns.");
    } finally {
      ps.unprepare();
    }*/
    return new Promise<boolean>((resolve, reject) => {
      
    })
  }

  public async tableExistsInSchema(
    schema: string,
    table: string
  ): Promise<boolean> {
    const result = await this.executeStatement(
      `SELECT DISTINCT 1 FROM metadata.column_meta WHERE table_schema = "${schema}" AND table_name = "${table}";`
    )
    return result.length > 0;
  }

  public async schemaExistsInDatabase(schema: string): Promise<boolean> {
    /*
    const ps = new sql.PreparedStatement();
    ps.input("schema", sql.NVarChar);

    await ps.prepare(
      "SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = @schema"
    );
    const result = await ps.execute({ schema });
    return result.recordset.length > 0;*/
    return new Promise<boolean>((resolve, reject) => {
      
    })
  }

  public async getRedundantValuesByColumns(
    table: string,
    columns: Array<string>
  ): Promise<any> {/*
    const stringColumns = columns.map((col) => '"' + col + '"').join(",");
    const query_result = await sql.query<SchemaQueryRow>(
      `SELECT SUM(redundance)
      FROM (SELECT COUNT(*) as redundance from (${table}) as temp_table GROUP BY ${stringColumns}) as temp_table_2
      WHERE redundance != 1`
    );

    return query_result.recordset[0][""];*/
    return new Promise<boolean>((resolve, reject) => {
      
    })
  }

  public async getRedundantGroupLengthByColumns(
    table: string,
    columns: Array<string>
  ): Promise<any> {
    /*
    const stringColumns = columns.map((col) => '"' + col + '"').join(",");
    const query_result = await sql.query<SchemaQueryRow>(
      `SELECT COUNT(*)
      FROM (SELECT ${stringColumns}, COUNT(*) as redundance FROM (${table}) as temp_table GROUP BY ${stringColumns}) as temp_table_2`
    );
    return query_result.recordset[0][""];*/
    return new Promise<boolean>((resolve, reject) => {
      
    })
  }

  public async getMaxValueByColumn(
    table: string,
    column: string
  ): Promise<any> {

    const query_result = await this.executeStatement(
      `SELECT max(character_length(${column})) cl FROM ${table}`
    );

    return query_result[0]["cl"];
  }

  public async getColumnSample(table: string, column: string): Promise<any> {
    /*
    const query_result = await sql.query<SchemaQueryRow>(
      `SELECT TOP 5000000 ${column} FROM ${table}`
    );
    return query_result.recordset;*/
    return new Promise<any>((resolve, reject) => {
      
    })
  }

  public override async getViolatingRowsForFD(
    _sql: string,
    lhs: Array<string>,
    rhs: Array<string>,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    /*const table: string = await this.createTempTable(_sql);

    const result: sql.IResult<any> = await sql.query(
      this.violatingRowsForFD_SQL(table, lhs, rhs) +
        ` ORDER BY ${lhs.join(",")}
          OFFSET ${offset} ROWS
          FETCH NEXT ${limit} ROWS ONLY
        `
    );
    await this.dropTempTable(table);
    return {
      rows: result.recordset,
      attributes: Object.keys(result.recordset.columns),
    };*/
    return new Promise<ITablePage>((resolve, reject) => {
      
    })
  }

  public async getViolatingRowsForSuggestedIND(
    referencingTableSql: string,
    referencedTableSql: string,
    columnRelationships: IColumnRelationship[],
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    /*const referencingTable: string = await this.createTempTable(
      referencingTableSql
    );
    const referencedTable: string = await this.createTempTable(
      referencedTableSql
    );

    const result: sql.IResult<any> = await sql.query(
      this.violatingRowsForSuggestedIND_SQL(
        referencingTable,
        referencedTable,
        columnRelationships
      ) +
        ` ORDER BY ${columnRelationships
          .map((cc) => cc.referencingColumn)
          .join(",")}
          OFFSET ${offset} ROWS
          FETCH NEXT ${limit} ROWS ONLY
        `

    );
    this.dropTempTable(referencingTable);
    this.dropTempTable(referencedTable);
    return {
      rows: result.recordset,
      attributes: Object.keys(result.recordset.columns),
    };*/

    return new Promise<ITablePage>((resolve, reject) => {
      
    })
  }

  public async getViolatingRowsForSuggestedINDCount(
    referencingTableSql: string,
    referencedTableSql: string,
    columnRelationships: IColumnRelationship[]
  ): Promise<IRowCounts> {
    /*const referencingTable: string = await this.createTempTable(
      referencingTableSql
    );
    const referencedTable: string = await this.createTempTable(
      referencedTableSql
    );
    const result = await sql.query<IRowCounts>(
      this.getViolatingRowsForINDCount_Sql(
        referencingTable,
        referencedTable,
        columnRelationships
      )
    );
    await this.dropTempTable(referencingTable);
    await this.dropTempTable(referencedTable);

    return result.recordset[0];*/
    return new Promise<IRowCounts>((resolve, reject) => {
      
    })
  }

  public async getViolatingRowsForFDCount(
    _sql: string,
    lhs: Array<string>,
    rhs: Array<string>
  ): Promise<IRowCounts> {
    /*const table: string = await this.createTempTable(_sql);
    const result = await sql.query<IRowCounts>(
      this.getViolatingRowsForFDCount_Sql(_sql, lhs, rhs)
    );
    this.dropTempTable(table);
    return result.recordset[0];*/
    return new Promise<IRowCounts>((resolve, reject) => {
      
    })
  }

  public async getForeignKeys(): Promise<ForeignKeyResult[]> {
    //Not implemented since not yet supported by spark
    const result = []
    return result
  }

  public async getPrimaryKeys(): Promise<PrimaryKeyResult[]> {
    //Not implemented since not yet supported by spark
    const result = []
    return result
  }

  public getJdbcPath(): string {
    return "kyuubi-hive-jdbc-shaded-1.5.0-SNAPSHOT.jar";
  }
  public getDbmsName(): DbmsType {
    return DbmsType.spark;
  }
}
