import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import Table from '../model/schema/Table';
import { Observable, shareReplay, map } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}
  public inputTables?: Array<Table>;
  private tableResult?: Observable<Array<Table>>;

  getITables(): Observable<Array<Table>> {
    if (!this.tableResult)
      this.tableResult = this.http
        .get<ITable[]>(`http://localhost:80/tables`)
        // required for caching
        .pipe(shareReplay(1))
        .pipe(
          map((iTables: Array<ITable>) =>
            iTables.map((iTable) => Table.fromITable(iTable))
          )
        );
    return this.tableResult;
  }

  // mapToTable(): Observable<Array<Table>> {
  //   return this.getITables().pipe(
  //     map((iTables: Array<ITable>) => iTables.map(iTable => Table.fromITable(iTable)))
  //   )
  // }

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
