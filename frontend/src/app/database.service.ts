import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import {
  IRequestBodyCreateTableSql,
  IRequestBodyDataTransferSql,
  IRequestBodyForeignKeySql,
} from '@server/definitions/IBackendAPI';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import Relationship from '../model/schema/Relationship';
import { Observable, shareReplay, map, Subject } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import IFk from '@server/definitions/IFk';
import ColumnCombination from '../model/schema/ColumnCombination';
import Column from '../model/schema/Column';
import IInclusionDependency from '@server/definitions/IInclusionDependencies';
import IRelationship from '@server/definitions/IRelationship';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public inputSchema?: Schema;
  private loadTableCallback = new Subject<Array<Table>>(); // Source
  loadTableCallback$ = this.loadTableCallback.asObservable(); // Stream
  // when using the angular dev server, you need to access another adress
  // for the BCNFStar express server. It is assumed that this server is
  // at http://localhost:80. In production mode, the serving server is assumed
  // to be the BCNFStar express server (found in backend/index.ts)
  public baseUrl: string = isDevMode() ? 'http://localhost:80' : '';
  private fks: Array<IFk> = [];

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  public loadTables(): Array<Table> {
    let tables: Array<Table> = [];
    this.getTables().subscribe((data) => {
      tables.push(...data);
      this.getIFks().subscribe((data) => {
        this.fks = data;
        this.loadTableCallback.next(tables);
      });
    });
    return tables;
  }

  private getTables(): Observable<Array<Table>> {
    let tableResult;
    if (!tableResult) {
      tableResult = this.http
        .get<ITable[]>(`${this.baseUrl}/tables`)
        // required for caching
        .pipe(shareReplay(1))
        .pipe(
          map((iTables: Array<ITable>) =>
            iTables.map((iTable) => Table.fromITable(iTable))
          )
        );
    }
    return tableResult;
  }

  private getIFks(): Observable<Array<IFk>> {
    let fks;
    fks = this.http
      .get<IFk[]>(`${this.baseUrl}/fks`)
      // required for caching
      .pipe(shareReplay(1));
    return fks;
  }

  private resolveIFks(fks: Array<IFk>) {
    fks.forEach((fk) => {
      let referencedTable: Table = [...this.inputSchema!.tables].filter(
        (table: Table) => fk.name == table.schemaAndName()
      )[0];
      let referencingTable: Table = [...this.inputSchema!.tables].filter(
        (table: Table) => fk.foreignName == table.schemaAndName()
      )[0];

      if (referencingTable && referencedTable) {
        let fkColumn: Column = referencingTable.columns.columnFromName(
          fk.foreignColumn
        );
        let pkColumn: Column = referencedTable.columns.columnFromName(
          fk.column
        );

        if (!referencedTable.pk) referencedTable.pk = new ColumnCombination();
        referencedTable.pk.add(pkColumn);

        let relationship = new Relationship();
        this.inputSchema!.fkRelationships.forEach((rel) => {
          if (rel.appliesTo(referencingTable, referencedTable)) {
            relationship = rel;
          }
        });
        relationship.add(fkColumn, pkColumn);
        this.inputSchema!.fkRelationships.add(relationship);
      }
    });
  }

  private resolveInds(inds: Array<IInclusionDependency>) {
    let schemaColumns = new Array<Column>();
    this.inputSchema!.tables.forEach((table) => {
      schemaColumns.push(...table.columns.columns);
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

  public setInputTables(tables: Array<Table>) {
    this.inputSchema = new Schema(...tables);
    this.inputSchema.tables.forEach((inputTable: Table) => {
      inputTable.schema = this.inputSchema;
      this.getFunctionalDependenciesByTable(inputTable).subscribe((fd) =>
        inputTable.setFds(
          ...fd.functionalDependencies.map((fds) =>
            FunctionalDependency.fromString(inputTable, fds)
          )
        )
      );
    });
    this.getINDsByTables(tables).subscribe((inds) => {
      this.resolveInds(inds);
    });
    this.resolveIFks(this.fks);
  }

  private fdResult: Record<string, Observable<IFunctionalDependencies>> = {};
  private getFunctionalDependenciesByTable(
    table: Table
  ): Observable<IFunctionalDependencies> {
    if (!this.fdResult[table.name])
      this.fdResult[table.name] = this.http
        .get<IFunctionalDependencies>(
          `${this.baseUrl}/tables/${table.schemaName}.${table.name}/fds`
        )
        .pipe(shareReplay(1));
    return this.fdResult[table.name];
  }

  getForeignKeySql(
    referencing: Table,
    relationship: Relationship,
    referenced: Table
  ): Promise<any> {
    const fk_name: string = 'fk_' + Math.random().toString(16).slice(2);

    const relationship_: IRelationship = {
      referencing: referencing.toITable(),
      referenced: referenced.toITable(),
      columnRelationships: referenced.pk!.inOrder().map((element) => {
        return {
          referencingColumn:
            relationship._referencing[
              relationship._referenced.indexOf(
                relationship._referenced.filter((c) => c.equals(element))[0]
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

    let result: any = this.http
      .post(`${this.baseUrl}/persist/createForeignKey`, data)
      .toPromise();

    return result;
  }

  getSchemaPreparationSql(schemaName: string, tables: Table[]): Promise<any> {
    const data = {
      schema: schemaName,
      tables: tables.map((table) => table.name),
    };
    let result: any = this.http
      .post(`${this.baseUrl}/persist/schemaPreparation`, data)
      .toPromise();
    return result;
  }

  getDataTransferSql(table: Table, attributes: Column[]): Promise<any> {
    const data: IRequestBodyDataTransferSql = {
      newSchema: table.schemaName!,
      newTable: table.name,
      relationships: table.relationships.map((rel) => rel.toIRelationship()),
      sourceTables: Array.from(table.sourceTables).map(
        (table) => `${table.schemaName!}.${table.name}`
      ),
      attributes: attributes.map((attr) => attr.toIAttribute()),
    };

    let result: any = this.http
      .post(`${this.baseUrl}/persist/dataTransfer`, data)
      .toPromise();
    return result;
  }

  getPrimaryKeySql(
    schema: string,
    table: string,
    primaryKey: string[]
  ): Promise<any> {
    const data = {
      schema: schema,
      table: table,
      primaryKey: primaryKey,
    };
    let result: any = this.http
      .post(`${this.baseUrl}/persist/createPrimaryKey`, data)
      .toPromise();
    return result;
  }

  getCreateTableSql(table: Table): Promise<any> {
    const [newSchema, newTable]: string[] = [table.schemaName, table.name];
    let primaryKey: string[] = [];
    if (table.pk) {
      primaryKey = table.pk!.columnNames();
    }
    const data: IRequestBodyCreateTableSql = {
      newSchema: newSchema,
      newTable: newTable,
      attributes: Array.from(table.columns.columns).map((column) => {
        return { name: column.name, dataType: column.dataType };
      }),
      primaryKey: primaryKey,
    };
    let result: any = this.http
      .post(`${this.baseUrl}/persist/createTable`, data)
      .toPromise();
    return result;
  }
  private getINDsByTables(
    tables: Array<Table>
  ): Observable<Array<IInclusionDependency>> {
    let tableNamesConcatenation = tables
      .map((table) => table.schemaName + '.' + table.name)
      .join();
    let indResult: Observable<Array<IInclusionDependency>> = this.http
      .get<Array<IInclusionDependency>>(
        `${this.baseUrl}/tables/${tableNamesConcatenation}/inds`
      )
      .pipe(shareReplay(1));
    return indResult;
  }
}
