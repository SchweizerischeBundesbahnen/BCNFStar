import { HttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import IRequestBodyFDViolatingRows from '@server/definitions/IRequestBodyFDViolatingRows';
import IRequestBodyINDViolatingRows from '@server/definitions/IRequestBodyINDViolatingRows';
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

  public abstract loadRowCount(): Promise<number>;
}

export class ViolatingINDRowsDataQuery extends DataQuery {
  protected relationship: Relationship;
  constructor(relationship: Relationship) {
    super();
    this.relationship = relationship;
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

  public override async loadRowCount(): Promise<number> {
    const data: IRequestBodyINDViolatingRows = {
      relationship: this.relationship.toIRelationship(),
      offset: 0,
      limit: 0,
    };
    return firstValueFrom(
      this.http.post<number>(`${this.baseUrl}/violatingRows/rowcount/ind`, data)
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
    limit: number
  ): Promise<ITablePage> {
    // currently supports only check on "sourceTables".
    if (this.table.sources.size != 1) throw Error('Not Implemented Exception');

    const data: IRequestBodyFDViolatingRows = {
      schema: [...this.table.sources][0].schemaName,
      table: [...this.table.sources][0].name,
      lhs: this.lhs.map((c) => c.name),
      rhs: this.rhs.map((c) => c.name),
      offset: offset,
      limit: limit,
    };
    return firstValueFrom(
      this.http.post<ITablePage>(`${this.baseUrl}/violatingRows/fd`, data)
    );
  }

  public override async loadRowCount(): Promise<number> {
    // currently supports only check on "sourceTables".
    if (this.table.sources.size != 1) throw Error('Not Implemented Exception');

    const data: IRequestBodyFDViolatingRows = {
      schema: [...this.table.sources][0].schemaName,
      table: [...this.table.sources][0].name,
      lhs: this.lhs.map((c) => c.name),
      rhs: this.rhs.map((c) => c.name),
      offset: 0,
      limit: 0,
    };
    return firstValueFrom(
      this.http.post<number>(`${this.baseUrl}/violatingRows/rowcount/fd`, data)
    );
  }
}
