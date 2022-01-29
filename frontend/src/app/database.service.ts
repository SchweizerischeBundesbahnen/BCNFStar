import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import Relationship from '../model/schema/Relationship';
import { Observable, shareReplay, map, Subject } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import IFk from '@server/definitions/IFk';
import ColumnCombination from '../model/schema/ColumnCombination';
import Column from '../model/schema/Column';

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
      let referencingTable: Table = [...this.inputSchema!.tables].filter(
        (table: Table) => fk.name == table.name
      )[0];
      let referencedTable: Table = [...this.inputSchema!.tables].filter(
        (table: Table) => fk.foreignName == table.name
      )[0];

      if (referencingTable && referencedTable) {
        let fkColumn: Column = referencingTable.columns.columnFromName(
          fk.column
        );
        let pkColumn: Column = referencedTable.columns.columnFromName(
          fk.foreignColumn
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
    this.resolveIFks(this.fks);
  }

  protected fdResult: Record<string, Observable<IFunctionalDependencies>> = {};
  private getFunctionalDependenciesByTable(
    table: Table
  ): Observable<IFunctionalDependencies> {
    if (!this.fdResult[table.name])
      this.fdResult[table.name] = this.http
        .get<IFunctionalDependencies>(
          `${this.baseUrl}/tables/${table.name}/fds`
        )
        .pipe(shareReplay(1));
    return this.fdResult[table.name];
  }

  getForeignKeySql(
    referencingTable: Table,
    referencedTable: Table
  ): Promise<any> {
    // TODO: Tabellen-Objekt sollte auch schema bekommen.... dann kann das hier weg...
    if (referencingTable.name.startsWith('public.')) {
      referencingTable.name = referencingTable.name.substring(7);
    }
    if (referencedTable.name.startsWith('public.')) {
      referencedTable.name = referencedTable.name.substring(7);
    }

    if (referencingTable.name.startsWith('dbo.')) {
      referencingTable.name = referencingTable.name.substring(4);
    }
    if (referencedTable.name.startsWith('dbo.')) {
      referencedTable.name = referencedTable.name.substring(4);
    }

    const key_columns: string[] = referencingTable
      .foreignKeyForReferencedTable(referencedTable)
      .columnNames();

    console.log(key_columns);
    // Da FK nur 40 Zeichen lang sein darf...
    const fk_name: string = 'fk_' + Math.random().toString(16).slice(2);

    const mapping: {}[] = [];
    for (let i = 0; i < key_columns.length; i++) {
      mapping.push({ key: key_columns[i], value: key_columns[i] });
    }

    const data = {
      referencingSchema: referencingTable.schemaName,
      referencingTable: referencingTable.name,
      referencedSchema: referencedTable.schemaName,
      referencedTable: referencedTable.name,
      constraintName: fk_name,
      mapping: mapping,
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
  getDataTransferSql(
    table: Table,
    originTable: Table,
    attributes: Column[]
  ): Promise<any> {
    const data = {
      originSchema: originTable.schemaName,
      originTable: originTable.name,
      newSchema: table.schemaName,
      newTable: table.name,
      attribute: attributes.map((str) => {
        return { name: str.name };
      }),
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
    const originSchema: string = table.columns.sourceTable().schemaName;
    const originTable: string = table.columns.sourceTable().name;
    const [newSchema, newTable]: string[] = [table.schemaName, table.name];
    const primaryKey: string[] = table.keys()[0].columnNames();

    const data = {
      originSchema: originSchema,
      originTable: originTable,
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
}
