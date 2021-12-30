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

  postForeignKey(
    referencingTable: Table,
    referencedTable: Table,
    schema: string
  ) {
    if (referencingTable.name.startsWith('public.')) {
      referencingTable.name = referencingTable.name.substring(7);
    }
    if (referencedTable.name.startsWith('public.')) {
      referencedTable.name = referencedTable.name.substring(7);
    }

    // console.log("ReferencingTable: ", referencingTable.name);
    // console.log("ReferencedTable: ", referencedTable.name);

    const key_columns: string[] = referencingTable
      .foreignKeyForReferencedTable(referencedTable)
      .columnNames();
    // console.log(key_columns);
    const fk_name: string = 'fk_' + Math.random().toString(16).slice(2); // + referencingTable.columns.columnNames().join("_") + "_" + referencedTable.columns.columnNames().join("_") + key_columns.join("_");

    const mapping: {}[] = [];
    for (let i = 0; i < key_columns.length; i++) {
      mapping.push({ key: key_columns[i], value: key_columns[i] });
    }

    // const mapping = key_columns.map(key => { return { key: key } });
    const data = {
      referencingSchema: schema,
      referencingTable: referencingTable.name,
      referencedSchema: schema,
      referencedTable: referencedTable.name,
      constraintName: fk_name,
      mapping: mapping,
    };

    this.http
      .post(`http://localhost:80/persist/createForeignKey`, data)
      .subscribe((res3: any) => {
        console.log(res3);
      });
  }

  postCreateTable(schema: string, table: Table, origin: Table) {
    // füllen des Body wie wir es im Backend erwarten.
    if (table.name.startsWith('public.')) {
      table.name = table.name.substring(7);
    }

    const [originSchema, originTable]: string[] = origin.name.split('.');
    const [newSchema, newTable]: string[] = [schema, table.name];
    const primaryKey: string[] = table.keys()[0].columnNames();

    const data = {
      originSchema: originSchema,
      originTable: originTable,
      newSchema: newSchema,
      newTable: newTable,

      attribute: table.columns.columnNames().map((str) => {
        return { name: str };
      }),
      primaryKey: primaryKey,
    };

    this.http
      .post(`http://localhost:80/persist/createTable`, data)
      .subscribe((res3: any) => {
        console.log(res3);
      });
  }

  // async getFunctionalDEpendenciesByTable2(table: Table): Promise<FunctionalDependency[]>{

  //   const tableName = table.name;
  //   const result = this.http.get<IFunctionalDependencies>(`http://localhost:80/tables/${tableName.replace('/', '.')}/fds`);
  //   let fds2: FunctionalDependency[] = [];
  //   result.subscribe(fd =>  fds2 = fd.functionalDependencies.map(fds => FunctionalDependency.fromString(table, fds)));

  // }
}
