import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import Table from '../model/schema/Table';
import { firstValueFrom } from 'rxjs';
import { IMetanomeJob } from '@server/definitions/IMetanomeJob';
import IRowCounts from '@server/definitions/IRowCounts';
import Column from '../model/schema/Column';
import { TableQuery } from './dataquery';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  /**
   * when using the angular dev server, you need to access another adress
   * for the BCNFStar express server. It is assumed that this server is
   * at http://localhost:80. In production mode, the serving server is assumed
   * to be the BCNFStar express server (found in backend/index.ts)
   **/
  public baseUrl: string = isDevMode() ? 'http://localhost:80' : '';

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  public async loadTables(): Promise<Array<Table>> {
    return this.getTables();
  }

  public async getDmbsName(): Promise<string> {
    return firstValueFrom(
      this.http.get<string>(`${this.baseUrl}/persist/dbmsname`)
    );
  }

  public loadTableRowCounts(): Promise<Record<string, IRowCounts>> {
    return firstValueFrom(
      this.http.get<Record<string, IRowCounts>>(`${this.baseUrl}/tables/rows`)
    );
  }

  private async getTables(): Promise<Array<Table>> {
    const iTables = await firstValueFrom(
      this.http.get<Array<ITable>>(this.baseUrl + '/tables')
    );
    const rowCounts = await this.loadTableRowCounts();
    const tables = iTables.map((iTable) => {
      return Table.fromITable(
        iTable,
        rowCounts[iTable.schemaName + '.' + iTable.name]?.entries ?? 0
      );
    });
    return tables;
  }

  public async runMetanome(entry: IMetanomeJob) {
    const job: IMetanomeJob = {
      algoClass: entry.algoClass,
      config: entry.config,
      schemaAndTables: entry.schemaAndTables,
    };
    return await firstValueFrom(
      this.http.post<{ message: string; fileName: string }>(
        `${this.baseUrl}/metanomeResults/`,
        job
      )
    );
  }

  public async getRedundanceByValueCombinations(
    table: Table,
    lhs: Array<Column>
  ): Promise<number> {
    let columns: Array<string> = [];
    lhs.forEach((col) => columns.push('"' + col.name + '"'));

    const tableSql = await new TableQuery(table).getTableSQL();

    return await firstValueFrom(
      this.http.get<number>(
        this.baseUrl +
          `/redundances?tableSql=${tableSql}&&fdColumns=[${columns}]`
      )
    );
  }

  public async getUniqueTuplesOfValueCombinations(
    table: Table,
    lhs: Array<Column>
  ): Promise<number> {
    let columns: Array<string> = [];
    lhs.forEach((col) => columns.push('"' + col.name + '"'));

    const tableSql = await new TableQuery(table).getTableSQL();

    return await firstValueFrom(
      this.http.get<number>(
        this.baseUrl +
          `/redundances/length?tableSql=${tableSql}&&fdColumns=[${columns}]`
      )
    );
  }
}
