import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import Table from '../model/schema/Table';
import { Observable, shareReplay, map, Subject } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import IFk from '@server/definitions/IFk';
import ColumnCombination from '../model/schema/ColumnCombination';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}
  public inputTables?: Array<Table>;
  // private tables: Array<Table> = [];
  private loadTableCallback = new Subject<Array<Table>>(); // Source
  loadTableCallback$ = this.loadTableCallback.asObservable(); // Stream

  public getAllTables(): Observable<Array<Table>> {
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

  public getFks(): Observable<Array<IFk>> {
    console.log('fks');
    let fks;
    fks = this.http
      .get<IFk[]>(`http://localhost:80/fks`)
      // required for caching
      .pipe(shareReplay(1));
    return fks;
  }

  public resolveIFks(fks: Array<IFk>, tables: Array<Table>) {
    console.log('resolve fks');
    fks.forEach((fk) => {
      let referencing_table: Table = tables.filter(
        (table) => fk.name == table.name
      )[0];
      let referenced_table: Table = tables.filter(
        (table) => fk.foreignName == table.name
      )[0];

      referencing_table.referencedTables.add(referenced_table);
      referenced_table.referencingTables.add(referencing_table);

      let fk_column: ColumnCombination =
        referencing_table.columns.columnsFromNames(fk.column);
      let pk_column: ColumnCombination =
        referenced_table.columns.columnsFromNames(fk.foreignColumn);

      referencing_table.columns.setMinus(fk_column).union(pk_column);

      if (!referenced_table.pk) referenced_table.pk = new ColumnCombination();
      referenced_table.pk.union(pk_column);
    });
  }

  // getTables(): Array<Table> {
  //   let tables: Array<Table> = [];
  //   console.log('DataService');
  //   this.getAllTables().subscribe((data) => {
  //     tables.push(...data);
  //     console.log('Nach Table: ');
  //     console.log(tables);
  //     this.getFks().subscribe(
  //       (data) => {
  //         this.resolveIFks(data, tables);
  //         console.log('Nach fks: ');
  //         console.log(tables);
  //       }
  //     );
  //   });
  // return tables;

  //}

  setInputTables(tables: Array<Table>) {
    this.inputTables = tables;
    this.inputTables.forEach((inputTable) => {
      this.getFunctionalDependenciesByTable(inputTable).subscribe((fd) =>
        inputTable.setFds(
          ...fd.functionalDependencies.map((fds) =>
            FunctionalDependency.fromString(inputTable, fds)
          )
        )
      );
    });
  }

  protected fdResult: Record<string, Observable<IFunctionalDependencies>> = {};
  getFunctionalDependenciesByTable(
    table: Table
  ): Observable<IFunctionalDependencies> {
    if (!this.fdResult[table.name])
      // const tableName = table.name;
      this.fdResult[table.name] = this.http
        .get<IFunctionalDependencies>(
          `http://localhost:80/tables/${table.name}/fds`
        )
        .pipe(shareReplay(1));
    return this.fdResult[table.name];
  }
}
