import { Component, OnInit } from '@angular/core';
import { SchemaService } from 'src/app/schema.service';
import { exampleTable } from 'src/model/schema/experiments';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent {
  tables!: Array<Table>;

  constructor(private schemaService: SchemaService) {
    this.tables = schemaService.allTables();
  }

  public selectTable(table: Table) {
    this.schemaService.inputTable = table;
  }
}
