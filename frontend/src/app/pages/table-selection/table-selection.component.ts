import Table from '@/src/model/schema/Table';
import { Component, OnInit } from '@angular/core';
import ITableHead from '@server/definitions/ITableHead';
import { DatabaseService } from 'src/app/database.service';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  tables: Map<Table, Boolean> = new Map();
  tableHeads: Array<ITableHead> = [];
  hoveredTable: Table = new Table();

  // eslint-disable-next-line no-unused-vars
  constructor(private dataService: DatabaseService) {}

  ngOnInit(): void {
    this.dataService.loadTableCallback$.subscribe((data) =>
      data.forEach((table) => this.tables.set(table, false))
    );
    this.dataService.loadTables();
    this.dataService
      .loadTableHeads()
      .subscribe((data) => (this.tableHeads = data));
  }

  public toggleCheckStatus(table: Table) {
    this.tables.set(table, !this.tables.get(table)!);
  }

  public hasSelectedTables(): boolean {
    return [...this.tables.values()].some((value) => value);
  }

  public selectTable() {
    this.dataService.setInputTables(
      [...this.tables.entries()]
        .filter((entry) => entry[1])
        .map((entry) => entry[0])
    );
  }

  public mouseEnter(table: Table) {
    this.hoveredTable = table;
    this.hoveredTableHead = this.tableHeads[table.name];
  }
}
