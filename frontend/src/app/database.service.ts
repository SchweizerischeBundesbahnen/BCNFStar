import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import Table from '../model/schema/Table';
import { Observable, shareReplay } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  public inputTable?: Table;

  private tableResult?: Observable<ITable[]>;
  getTableNames(): Observable<ITable[]> {
    if (!this.tableResult)
      this.tableResult = this.http
        .get<ITable[]>(`http://localhost:80/tables`)
        // required for caching
        .pipe(shareReplay(1));
    return this.tableResult;
  }

  setInputTable(table: ITable) {
    this.inputTable = Table.fromITable(table);
    this.getFunctionalDependenciesByTable(this.inputTable).subscribe((fd) =>
      this.inputTable!.setFds(
        ...fd.functionalDependencies.map((fds) =>
          FunctionalDependency.fromString(this.inputTable!, fds)
        )
      )
    );
  }

  /*
  localhost:80/tables/public.customer/fds

  {
    "tableName": "public.customer",
    "functionalDependencies": [
        "[c_name] --> c_acctbal, c_address, c_comment, c_custkey, c_mktsegment, c_nationkey, c_phone",
        "[c_phone] --> c_acctbal, c_address, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey",
        "[c_comment] --> c_acctbal, c_address, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone",
        "[c_acctbal] --> c_address, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone",
        "[c_custkey] --> c_acctbal, c_address, c_comment, c_mktsegment, c_name, c_nationkey, c_phone",
        "[c_address] --> c_acctbal, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone"
    ]
  }
  */
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
    // let fds2: FunctionalDependency[] = [];
    // result.subscribe(fd =>  fds2 = fd.functionalDependencies.map(fds => FunctionalDependency.fromString(table, fds)));
    // console.log("FDS");
    // console.log(fds2);
    return this.fdResult[table.name];
  }

  // async getFunctionalDEpendenciesByTable2(table: Table): Promise<FunctionalDependency[]>{

  //   const tableName = table.name;
  //   const result = this.http.get<IFunctionalDependencies>(`http://localhost:80/tables/${tableName.replace('/', '.')}/fds`);
  //   let fds2: FunctionalDependency[] = [];
  //   result.subscribe(fd =>  fds2 = fd.functionalDependencies.map(fds => FunctionalDependency.fromString(table, fds)));

  // }
}
