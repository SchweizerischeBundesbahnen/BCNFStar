import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import ITableHead from '@server/definitions/ITableHead';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import {
  IRequestBodyCreateTableSql,
  IRequestBodyDataTransferSql,
  IRequestBodyForeignKeySql,
} from '@server/definitions/IBackendAPI';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import Relationship from '../model/schema/Relationship';
import { firstValueFrom } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import IForeignKey from '@server/definitions/IForeignKey';
import Column from '../model/schema/Column';
import IInclusionDependency from '@server/definitions/IInclusionDependencies';
import IRelationship from '@server/definitions/IRelationship';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public inputSchema?: Schema;
  /**
   * when using the angular dev server, you need to access another adress
   * for the BCNFStar express server. It is assumed that this server is
   * at http://localhost:80. In production mode, the serving server is assumed
   * to be the BCNFStar express server (found in backend/index.ts)
   **/
  public baseUrl: string = isDevMode() ? 'http://localhost:80' : '';
  private iFks: Array<IForeignKey> = [];

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  public async loadTables(): Promise<Array<Table>> {
    this.iFks = await this.getIFks();
    return this.getTables();
  }

  public async loadTableHeads(
    limit: number
  ): Promise<Record<string, ITableHead>> {
    let tableHeads;
    tableHeads = await firstValueFrom(
      this.http.get<Record<string, ITableHead>>(
        `${this.baseUrl}/tables/heads?limit=${limit}`
      )
    );
    return tableHeads;
  }

  public async loadTableRowCounts(): Promise<Record<string, number>> {
    let tableRowCounts;
    tableRowCounts = await firstValueFrom(
      this.http.get<Record<string, number>>(`${this.baseUrl}/tables/rows`)
    );
    return tableRowCounts;
  }

  private async getTables(): Promise<Array<Table>> {
    const iTables = await firstValueFrom(
      this.http.get<Array<ITable>>(this.baseUrl + '/tables')
    );
    const tables = iTables.map((iTable) => Table.fromITable(iTable));
    return tables;
  }

  private getIFks(): Promise<Array<IForeignKey>> {
    return firstValueFrom(
      this.http.get<Array<IForeignKey>>(this.baseUrl + '/fks')
    );
  }

  private resolveIFks(fks: Array<IForeignKey>) {
    fks.forEach((fk) => {
      let referencingTable = [...this.inputSchema!.tables].find(
        (table: Table) => fk.name == table.schemaAndName()
      );
      let referencedTable = [...this.inputSchema!.tables].find(
        (table: Table) => fk.foreignName == table.schemaAndName()
      );

      if (referencingTable && referencedTable) {
        let fkColumn = referencingTable.columns.columnFromName(fk.column)!;
        let pkColumn = referencedTable.columns.columnFromName(
          fk.foreignColumn
        )!;

        let relationship =
          [...this.inputSchema!.fks].find((rel) =>
            rel.appliesTo(referencingTable!, referencedTable!)
          ) || new Relationship();
        relationship.add(fkColumn, pkColumn);
        this.inputSchema!.addFk(relationship);
      }
    });
  }

  private resolveInds(inds: Array<IInclusionDependency>) {
    let schemaColumns = new Array<Column>();
    this.inputSchema!.tables.forEach((table) => {
      schemaColumns.push(...table.columns.asSet());
    });
    inds.forEach((ind) => {
      let indRelationship = new Relationship();
      let numColumns = ind.dependant.columnIdentifiers.length;
      for (let i = 0; i < numColumns; i++) {
        let dependantIColumn = ind.dependant.columnIdentifiers[i];
        let dependantColumn = schemaColumns.find(
          (column) =>
            dependantIColumn.columnIdentifier == column.source.name &&
            dependantIColumn.schemaIdentifier ==
              column.source.table.schemaName &&
            dependantIColumn.tableIdentifier == column.source.table.name
        )!;

        let referencedIColumn = ind.referenced.columnIdentifiers[i];
        let referencedColumn = schemaColumns.find(
          (column) =>
            referencedIColumn.columnIdentifier == column.source.name &&
            referencedIColumn.schemaIdentifier ==
              column.source.table.schemaName &&
            referencedIColumn.tableIdentifier == column.source.table.name
        )!;

        indRelationship.add(dependantColumn, referencedColumn);
      }
      this.inputSchema!.addInd(indRelationship);
    });
  }

  public async setInputTables(tables: Array<Table>) {
    const indPromise = this.getINDs(tables);
    const fdResults = await Promise.all(tables.map((v) => this.getFDs(v)));

    this.inputSchema = new Schema(...tables);
    for (const table of tables) {
      const iFDs = fdResults.find(
        (v) => v.tableName == table.schemaAndName()
      ) as IFunctionalDependencies;
      const fds = iFDs.functionalDependencies.map((fds) =>
        FunctionalDependency.fromString(table, fds)
      );
      table.setFds(...fds);
    }
    this.resolveInds(await indPromise);
    this.resolveIFks(this.iFks);
  }

  private getFDs(table: Table): Promise<IFunctionalDependencies> {
    return firstValueFrom(
      this.http.get<IFunctionalDependencies>(
        `${this.baseUrl}/tables/${table.schemaAndName()}/fds`
      )
    );
  }

  private getINDs(tables: Array<Table>): Promise<Array<IInclusionDependency>> {
    let tableNamesConcatenation = tables
      .map((table) => table.schemaAndName())
      .join(',');
    return firstValueFrom(
      this.http.get<Array<IInclusionDependency>>(
        `${this.baseUrl}/tables/${tableNamesConcatenation}/inds`
      )
    );
  }

  getForeignKeySql(
    referencing: Table,
    relationship: Relationship,
    referenced: Table
  ): Promise<{ sql: string }> {
    const fk_name: string = 'fk_' + Math.random().toString(16).slice(2);

    const relationship_: IRelationship = {
      referencing: referencing.toITable(),
      referenced: referenced.toITable(),
      columnRelationships: referenced.pk!.inOrder().map((element) => {
        return {
          referencingColumn:
            relationship._referencing[
              relationship._referenced.indexOf(
                relationship._referenced.find((c) => c.equals(element))!
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

  getSchemaPreparationSql(
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

  getDataTransferSql(
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
        (table) => `${table.schemaAndName()}`
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

  getPrimaryKeySql(
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

  getCreateTableSql(table: Table): Promise<{ sql: string }> {
    const [newSchema, newTable]: string[] = [table.schemaName, table.name];
    let primaryKey: string[] = [];
    if (table.pk) {
      primaryKey = table.pk!.columnNames();
    }
    const data: IRequestBodyCreateTableSql = {
      newSchema: newSchema,
      newTable: newTable,
      attributes: table.columns.asArray().map((column) => {
        return { name: column.name, dataType: column.dataType };
      }),
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
