import { Injectable } from '@angular/core';
import { exampleTable } from 'src/model/schema/experiments';
import Table from 'src/model/schema/Table';

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  public inputTable?: Table;

  constructor() {}

  public allTables(): Array<Table> {
    return [exampleTable()];
  }
}
