import { Injectable } from '@angular/core';
import { exampleTable } from 'src/model/schema/experiments';
import Table from 'src/model/schema/Table';

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  public inputTable?: Table;
  public selectedTable?: Table;

  constructor() {}

  public allTables(): Array<Table> {
    let table2: Table = exampleTable();
    table2.split(table2.violatingFds()[0]);
    return [exampleTable(), table2];
  }
}
