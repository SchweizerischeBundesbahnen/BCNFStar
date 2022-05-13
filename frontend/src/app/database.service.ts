import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import ITablePage from '@server/definitions/ITablePage';
import {
  IRequestBodyCreateTableSql,
  IRequestBodyDataTransferSql,
  IRequestBodyForeignKeySql,
} from '@server/definitions/IBackendAPI';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import Relationship from '../model/schema/Relationship';
import { firstValueFrom } from 'rxjs';
import Column from '../model/schema/Column';
import IRelationship from '@server/definitions/IRelationship';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { IMetanomeJob } from '@server/definitions/IMetanomeJob';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private _schema?: Schema;

  get schema() {
    return this._schema!;
  }
  set schema(schema: Schema) {
    this._schema = schema;
  }
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

  public loadTablePage(
    schema: string,
    table: string,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    return firstValueFrom(
      this.http.get<ITablePage>(
        `${this.baseUrl}/tables/page?schema=${schema}&table=${table}&offset=${offset}&limit=${limit}`
      )
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

  public getForeignKeySql(
    referencing: Table,
    relationship: Relationship,
    referenced: Table
  ): Promise<{ sql: string }> {
    const fk_name: string = 'fk_' + Math.random().toString(16).slice(2);

    const relationship_: IRelationship = {
      referencing: referencing.toITable(),
      referenced: referenced.toITable(),
      columnRelationships: referenced.pk!.asArray().map((element) => {
        return {
          referencingColumn:
            relationship.referencing[
              relationship.referenced.indexOf(
                relationship.referenced.find((c) => c.equals(element))!
              )
            ].name,
          referencedColumn: element.name,
        };
      }),
    };

    const data: IRequestBodyForeignKeySql = {
      name: fk_name,
      relationship: relationship_,
    };

    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/createForeignKey`,
        data
      )
    );
  }

  public getSchemaPreparationSql(
    schemaName: string,
    tables: Table[]
  ): Promise<{ sql: string }> {
    const data = {
      schema: schemaName,
      tables: tables.map((table) => table.name),
    };
    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/schemaPreparation`,
        data
      )
    );
  }

  public getDataTransferSql(
    table: Table,
    attributes: Column[]
  ): Promise<{ sql: string }> {
    const data: IRequestBodyDataTransferSql = {
      newSchema: table.schemaName!,
      newTable: table.name,
      relationships: [...table.relationships].map((rel) =>
        rel.toIRelationship()
      ),
      sourceTables: Array.from(table.sources).map(
        (source) => `${source.table.fullName}`
      ),
      attributes: attributes.map((attr) => attr.toIAttribute()),
    };

    let result = firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/dataTransfer`,
        data
      )
    );
    return result;
  }

  public getPrimaryKeySql(
    schema: string,
    table: string,
    primaryKey: string[]
  ): Promise<{ sql: string }> {
    const data = {
      schema: schema,
      table: table,
      primaryKey: primaryKey,
    };
    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/createPrimaryKey`,
        data
      )
    );
  }

  public getCreateTableSql(table: Table): Promise<{ sql: string }> {
    const [newSchema, newTable]: string[] = [table.schemaName, table.name];
    let primaryKey: string[] = [];
    if (table.pk) {
      primaryKey = table.pk!.columnNames();
    }
    const data: IRequestBodyCreateTableSql = {
      newSchema: newSchema,
      newTable: newTable,
      attributes: table.columns
        .asArray()
        .map((column) => column.toIAttribute()),
      primaryKey: primaryKey,
    };
    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/createTable`,
        data
      )
    );
  }
}
