import { HttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import IRequestBodyFDViolatingRows from '@server/definitions/IRequestBodyFDViolatingRows';
import IRequestBodyINDViolatingRows from '@server/definitions/IRequestBodyINDViolatingRows';
import IRowCounts from '@server/definitions/IRowCounts';
import ITablePage from '@server/definitions/ITablePage';
import { firstValueFrom } from 'rxjs';
import Column from '../model/schema/Column';
import Relationship from '../model/schema/Relationship';
import Table from '../model/schema/Table';
import { InjectorInstance } from './app.module';

export abstract class DataQuery {
  protected baseUrl: string = isDevMode() ? 'http://localhost:80' : '';
  protected http: HttpClient;
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
  constructor(protected relationship: Relationship) {
    super();
  }

  public override async loadTablePage(
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    const data: IRequestBodyINDViolatingRows = {
      relationship: this.relationship.toIRelationship(),
      offset: offset,
      limit: limit,
    };
    return firstValueFrom(
      this.http.post<ITablePage>(`${this.baseUrl}/violatingRows/ind`, data)
    );
  }

  public override async loadRowCount(): Promise<IRowCounts> {
    const data: IRequestBodyINDViolatingRows = {
      relationship: this.relationship.toIRelationship(),
      offset: 0,
      limit: 0,
    };
    return firstValueFrom(
      this.http.post<IRowCounts>(
        `${this.baseUrl}/violatingRows/rowcount/ind`,
        data
      )
    );
  }
}

export class ViolatingFDRowsDataQuery extends DataQuery {
  protected table: Table;
  protected lhs: Array<Column>;
  protected rhs: Array<Column>;
  constructor(table: Table, lhs: Array<Column>, rhs: Array<Column>) {
    super();
    this.table = table;
    this.lhs = lhs;
    this.rhs = rhs;
  }

  public override async loadTablePage(
    offset: number,
    limit: number,
    withSeparators = true
  ): Promise<ITablePage> {
    // currently supports only check on "sourceTables".
    if (this.table.sources.length != 1)
      throw Error('Not Implemented Exception');

    const lhsNames = this.lhs.map((c) => c.sourceColumn.name);
    const data: IRequestBodyFDViolatingRows = {
      schema: this.table.sources[0].table.schemaName,
      table: this.table.sources[0].table.name,
      lhs: lhsNames,
      rhs: this.rhs.map((c) => c.sourceColumn.name),
      offset: offset,
      limit: limit,
    };
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
    // currently supports only check on "sourceTables".
    if (this.table.sources.length != 1)
      throw Error('Not Implemented Exception');
    const data: IRequestBodyFDViolatingRows = {
      schema: this.table.sources[0].table.schemaName,
      table: this.table.sources[0].table.name,
      lhs: this.lhs.map((c) => c.sourceColumn.name),
      rhs: this.rhs.map((c) => c.sourceColumn.name),
      offset: 0,
      limit: 0,
    };
    return firstValueFrom(
      this.http.post<IRowCounts>(
        `${this.baseUrl}/violatingRows/rowcount/fd`,
        data
      )
    );
  }
}
