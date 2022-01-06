import Table from '@/src/model/schema/Table';
import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  tables: Map<Table, Boolean> = new Map();

  // eslint-disable-next-line no-unused-vars
  constructor(private dataService: DatabaseService) {}

  ngOnInit(): void {
    this.dataService
      .getITables()
      .subscribe((data) =>
        data.forEach((table) => this.tables.set(table, false))
      );
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
}
