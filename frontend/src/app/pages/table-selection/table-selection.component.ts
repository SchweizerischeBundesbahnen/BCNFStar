import Table from '@/src/model/schema/Table';
import { Component, OnInit, ViewChild } from '@angular/core';
import ITableHead from '@server/definitions/ITableHead';
import { DatabaseService } from 'src/app/database.service';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  @ViewChild(SbbTable) table!: SbbTable<ITableHead>;
  public tables: Map<Table, Boolean> = new Map();
  public tableHeads: Map<string, ITableHead> = new Map();
  public tableRowCounts: Map<string, number> = new Map();
  public headLimit: number = 20;

  public hoveredTable: Table = new Table();
  public tableColumns: string[] = [];
  public dataSource: SbbTableDataSource<any> = new SbbTableDataSource<any>([]);

  // eslint-disable-next-line no-unused-vars
  constructor(private dataService: DatabaseService) {}

  ngOnInit(): void {
    this.dataService.loadTableCallback$.subscribe((data) =>
      data.forEach((table) => this.tables.set(table, false))
    );
    this.dataService.loadTables();
    this.dataService
      .loadTableHeads(this.headLimit)
      .subscribe((data) => (this.tableHeads = new Map(Object.entries(data))));
    this.dataService
      .loadTableRowCounts()
      .subscribe(
        (data) => (this.tableRowCounts = new Map(Object.entries(data)))
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

  public mouseEnter(table: Table) {
    this.hoveredTable = table;
    let hoveredTableHead = this.tableHeads.get(table.name);

    if (hoveredTableHead) {
      this.tableColumns = hoveredTableHead.attributes;
      this.dataSource.data = hoveredTableHead.rows;
    } else {
      this.tableColumns = [];
      this.dataSource.data = [];
    }
    this.table.renderRows();
  }
}
