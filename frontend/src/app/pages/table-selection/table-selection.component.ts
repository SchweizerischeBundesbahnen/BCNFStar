import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import ITable from '../../../../../server/definitions/ITable';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
/*export class TableSelectionComponent {
  tables!: Array<Table>;

  constructor(private schemaService: SchemaService) {
    this.tables = schemaService.allTables();
  }

  public selectTable(table: Table) {
    this.schemaService.inputTable = table;
  }
  */
export class TableSelectionComponent implements OnInit {
  // eslint-disable-next-line no-unused-vars
  constructor(private dataService: DatabaseService) {}

  ngOnInit(): void {
    this.dataService.getTableNames().subscribe((data) => (this.tables = data));
  }

  tables: ITable[] = [];
}
