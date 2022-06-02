import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import { firstValueFrom } from 'rxjs';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { IMetanomeJob } from '@server/definitions/IMetanomeJob';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public schema?: Schema;

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

  public loadTableRowCounts(): Promise<Record<string, number>> {
    return firstValueFrom(
      this.http.get<Record<string, number>>(`${this.baseUrl}/tables/rows`)
    );
  }

  private async getTables(): Promise<Array<Table>> {
    const iTables = await firstValueFrom(
      this.http.get<Array<ITable>>(this.baseUrl + '/tables')
    );
    const tables = iTables.map((iTable) => Table.fromITable(iTable));
    return tables;
  }

  public async runMetanome(entry: IIndexFileEntry) {
    const job: IMetanomeJob = {
      algoClass: entry.algorithm,
      config: entry.config,
      schemaAndTables: entry.tables,
    };
    return await firstValueFrom(
      this.http.post<{ message: string; fileName: string }>(
        `${this.baseUrl}/metanomeResults/`,
        job
      )
    );
  }
}
