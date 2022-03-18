import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import Relationship from '../model/schema/Relationship';
import { firstValueFrom } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import IForeignKey from '@server/definitions/IForeignKey';
import ColumnCombination from '../model/schema/ColumnCombination';
import Column from '../model/schema/Column';
import IInclusionDependency from '@server/definitions/IInclusionDependencies';

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
        (table: Table) => fk.name == table.name
      );
      let referencedTable = [...this.inputSchema!.tables].find(
        (table: Table) => fk.foreignName == table.name
      );

      if (referencingTable && referencedTable) {
        let fkColumn: Column = referencingTable.columns.columnFromName(
          fk.column
        );
        let pkColumn: Column = referencedTable.columns.columnFromName(
          fk.foreignColumn
        );

        if (!referencedTable.pk) referencedTable.pk = new ColumnCombination();
        referencedTable.pk.add(pkColumn);

        let relationship =
          [...this.inputSchema!.fkRelationships].find((rel) =>
            rel.appliesTo(referencingTable!, referencedTable!)
          ) || new Relationship();
        relationship.add(fkColumn, pkColumn);
        this.inputSchema!.fkRelationships.add(relationship);
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
        let dependantColumn = schemaColumns.filter(
          (column) =>
            dependantIColumn.columnIdentifier == column.name &&
            'public.' + dependantIColumn.schemaIdentifier ==
              column.sourceTable.name
        )[0];

        let referencedIColumn = ind.referenced.columnIdentifiers[i];
        let referencedColumn = schemaColumns.filter(
          (column) =>
            referencedIColumn.columnIdentifier == column.name &&
            'public.' + referencedIColumn.schemaIdentifier ==
              column.sourceTable.name
        )[0];

        indRelationship.add(dependantColumn, referencedColumn);
      }
      this.inputSchema!.indRelationships.add(indRelationship);
    });
  }

  public async setInputTables(tables: Array<Table>) {
    const indPromise = this.getINDs(tables);
    const fdResults = await Promise.all(tables.map((v) => this.getFDs(v)));

    this.inputSchema = new Schema(...tables);
    for (const table of tables) {
      table.schema = this.inputSchema;
      const iFDs = fdResults.find(
        (v) => v.tableName == table.name
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
        `${this.baseUrl}/tables/${table.name}/fds`
      )
    );
  }

  private getINDs(tables: Array<Table>): Promise<Array<IInclusionDependency>> {
    let tableNamesConcatenation = tables.map((table) => table.name).join(',');
    return firstValueFrom(
      this.http.get<Array<IInclusionDependency>>(
        `${this.baseUrl}/tables/${tableNamesConcatenation}/inds`
      )
    );
  }
}
