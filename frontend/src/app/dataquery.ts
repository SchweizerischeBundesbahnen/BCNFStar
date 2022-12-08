import { HttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import IRequestBodyFDViolatingRows from '@server/definitions/IRequestBodyFDViolatingRows';
import IRequestBodyINDViolatingRows from '@server/definitions/IRequestBodyINDViolatingRows';
import IRowCounts from '@server/definitions/IRowCounts';
import ITablePage from '@server/definitions/ITablePage';
import { firstValueFrom } from 'rxjs';
import Column from '../model/schema/Column';
import MsSqlPersisting from '../model/schema/persisting/MsSqlPersisting';
import PostgreSQLPersisting from '../model/schema/persisting/PostgreSQLPersisting';
import SQLPersisting from '../model/schema/persisting/SQLPersisting';
import SynapseSqlPersisting from '../model/schema/persisting/SynapseSqlPersisting';
import SparkSqlPersisting from '../model/schema/persisting/SparkSqlPersisting';
import TableRelationship from '../model/schema/TableRelationship';
import Table from '../model/schema/Table';
import { InjectorInstance } from './app.module';

export abstract class DataQuery {
  protected baseUrl: string = isDevMode() ? 'http://localhost:80' : '';
  protected http: HttpClient;

  protected SqlGeneration?: SQLPersisting;

  public async getDmbsName(): Promise<string> {
    return firstValueFrom(
      this.http.get<string>(`${this.baseUrl}/persist/dbmsname`)
    );
  }

  public async initPersisting(): Promise<void> {
    const dbmsName: string = await this.getDmbsName();
    if (dbmsName == 'postgres') {
      this.SqlGeneration = new PostgreSQLPersisting('XXXXXXXXXXXX');
    } else if (dbmsName == 'mssql') {
      this.SqlGeneration = new MsSqlPersisting('XXXXXXXXXXXX');
    } else if (dbmsName == 'synapse') {
      this.SqlGeneration = new SynapseSqlPersisting('XXXXXXXXXXXX');
    } else if (dbmsName == 'hive2') {
      this.SqlGeneration = new SparkSqlPersisting('XXXXXXXXXXXX');
    } else {
      throw Error('Unknown Dbms-Server');
    }
  }

  constructor() {
    this.http = InjectorInstance.get<HttpClient>(HttpClient);
  }

  public abstract loadTablePage(
    offset: number,
    limit: number
  ): Promise<ITablePage>;

  public abstract loadRowCount(): Promise<IRowCounts>;

  /**
   *
   * @returns an object where a key is an attribute and the value is
   *  the styling which should be applied to cells in this column
   */
  public get cellStyle(): Record<string, Record<string, any>> {
    return {};
  }
}

export class TableQuery extends DataQuery {
  constructor(private table: Table) {
    super();
  }

  public override async loadTablePage(): Promise<ITablePage> {
    return new Promise<ITablePage>(() => {});
  }

  public override async loadRowCount(): Promise<IRowCounts> {
    return new Promise<IRowCounts>(() => {});
  }

  public async getTableSQL() {
    await this.initPersisting();
    return this.SqlGeneration!.selectStatement(
      this.table,
      this.table.columns.asArray()
    );
  }
}

export class TablePreviewDataQuery extends DataQuery {
  constructor(protected table: Table) {
    super();
  }
  public loadTablePage(offset: number, limit: number): Promise<ITablePage> {
    return firstValueFrom(
      this.http.get<ITablePage>(
        `${this.baseUrl}/tables/page?schema=${this.table.schemaName}&table=${this.table.name}&offset=${offset}&limit=${limit}`
      )
    );
  }
  public loadRowCount(): Promise<IRowCounts> {
    return Promise.reject(
      'not implemented. use loadTableRowCounts from database-service instead'
    );
  }
  public override get cellStyle(): Record<string, Record<string, any>> {
    function isNumeric(dataType: string): boolean {
      return (
        !!dataType &&
        (dataType.toLowerCase().startsWith('numeric') ||
          dataType.toLowerCase().startsWith('int'))
      );
    }
    const result: Record<string, Record<string, any>> = {};
    for (const column of this.table.columns)
      result[column.name] = isNumeric(column.dataType)
        ? { 'text-align': 'end' }
        : {};
    return result;
  }
}

export class ViolatingINDRowsDataQuery extends DataQuery {
  public static async Create(
    relationship: TableRelationship
  ): Promise<ViolatingINDRowsDataQuery> {
    const indRowDataQuery = new ViolatingINDRowsDataQuery(relationship);
    await indRowDataQuery.initPersisting();
    return indRowDataQuery;
  }

  private constructor(protected tableRelationship: TableRelationship) {
    super();
  }

  public override async loadTablePage(
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    const data = this.body(offset, limit);
    return firstValueFrom(
      this.http.post<ITablePage>(`${this.baseUrl}/violatingRows/ind`, data)
    );
  }

  public override async loadRowCount(): Promise<IRowCounts> {
    const data = this.body();
    return firstValueFrom(
      this.http.post<IRowCounts>(
        `${this.baseUrl}/violatingRows/rowcount/ind`,
        data
      )
    );
  }

  private body(offset = 0, limit = 0): IRequestBodyINDViolatingRows {
    const data: IRequestBodyINDViolatingRows = {
      referencingTableSql: this.SqlGeneration!.selectStatement(
        this.tableRelationship.referencingTable,
        this.tableRelationship.referencingCols,
        [],
        true
      ),
      referencedTableSql: this.SqlGeneration!.selectStatement(
        this.tableRelationship.referencedTable,
        this.tableRelationship.referencedCols,
        [],
        true
      ),
      relationship: this.tableRelationship.relationship.toIRelationship(),
      offset: offset,
      limit: limit,
    };

    return data;
  }
}

export class ViolatingFDRowsDataQuery extends DataQuery {
  public static async Create(
    table: Table,
    lhs: Array<Column>,
    rhs: Array<Column>
  ): Promise<ViolatingFDRowsDataQuery> {
    const fdRowDataQuery = new ViolatingFDRowsDataQuery(table, lhs, rhs);
    await fdRowDataQuery.initPersisting();
    return fdRowDataQuery;
  }

  private constructor(
    protected table: Table,
    protected lhs: Array<Column>,
    protected rhs: Array<Column>
  ) {
    super();
  }

  public override async loadTablePage(
    offset: number,
    limit: number,
    withSeparators = true
  ): Promise<ITablePage> {
    const lhsNames = this.lhs.map((c) => c.name);
    const data = this.body(offset, limit);
    const result = await firstValueFrom(
      this.http.post<ITablePage>(`${this.baseUrl}/violatingRows/fd`, data)
    );
    if (!withSeparators) return result;
    // before every new lhs value, add a separator announcing that value
    let currentLhsValues: Array<string> = [];
    const newRows: Array<Record<string, any>> = [];
    for (const row of result.rows) {
      // = if lhs is differnt from last row
      if (!lhsNames.every((name) => currentLhsValues.includes(row[name]))) {
        // = Array<[attribute name, attribute value]>
        const currentLhs: Array<[string, string]> = lhsNames.map((name) => [
          name,
          row[name],
        ]);
        newRows.push({
          isGroupBy: true,
          title:
            'Values that violate the key: \n' +
            currentLhs.map(([key, value]) => `${key}: ${value}`).join('\n '),
        });
        currentLhsValues = currentLhs.map(([, value]) => value);
      }
      newRows.push(row);
    }
    result.rows = newRows;
    return result;
  }

  public override async loadRowCount(): Promise<IRowCounts> {
    const data = this.body();
    return firstValueFrom(
      this.http.post<IRowCounts>(
        `${this.baseUrl}/violatingRows/rowcount/fd`,
        data
      )
    );
  }

  private body(offset = 0, limit = 0): IRequestBodyFDViolatingRows {
    const data: IRequestBodyFDViolatingRows = {
      sql: this.SqlGeneration!.selectStatement(
        this.table,
        this.table.columns.asArray(),
        [],
        true
      ),
      lhs: this.lhs.map((c) => c.name),
      rhs: this.rhs.map((c) => c.name),
      offset: offset,
      limit: limit,
    };
    return data;
  }
}
