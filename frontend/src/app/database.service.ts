import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '../../../server/definitions/ITable';
import IFunctionalDependencies from '../../../server/definitions/IFunctionalDependencies';
import Table from '../model/schema/Table';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  public inputTable?: Table;

  getTableNames() {
    const result = this.http.get<ITable[]>('http://localhost:80/tables');
    return result;
  }

  setInputTable(table: ITable) {
    this.inputTable = Table.fromITable(table);
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
  getFunctionalDependenciesByTable(table: Table) {
    // const tableName = table.name;
    const result = this.http.get<IFunctionalDependencies>(
      `http://localhost:80/tables/${table.name}/fds`
    );
    // let fds2: FunctionalDependency[] = [];
    // result.subscribe(fd =>  fds2 = fd.functionalDependencies.map(fds => FunctionalDependency.fromString(table, fds)));
    // console.log("FDS");
    // console.log(fds2);
    return result;
  }

  // async getFunctionalDEpendenciesByTable2(table: Table): Promise<FunctionalDependency[]>{

  //   const tableName = table.name;
  //   const result = this.http.get<IFunctionalDependencies>(`http://localhost:80/tables/${tableName.replace('/', '.')}/fds`);
  //   let fds2: FunctionalDependency[] = [];
  //   result.subscribe(fd =>  fds2 = fd.functionalDependencies.map(fds => FunctionalDependency.fromString(table, fds)));

  // }
}
