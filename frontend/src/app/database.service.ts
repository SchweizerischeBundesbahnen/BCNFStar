import { Injectable } from '@angular/core';
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
        .get<ITable[]>(`http://localhost:80/tables`)
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
      .get<IFk[]>(`http://localhost:80/fks`)
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
          `http://localhost:80/tables/${table.name}/fds`
        )
        .pipe(shareReplay(1));
    return this.fdResult[table.name];
  }
}
