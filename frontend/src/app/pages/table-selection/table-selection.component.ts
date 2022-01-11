import Table from '@/src/model/schema/Table';
import { Component, OnInit } from '@angular/core';
import ITableHead from '@server/definitions/ITableHead';
import { DatabaseService } from 'src/app/database.service';
import { SbbTableDataSource } from '@sbb-esta/angular/table';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  tables: Map<Table, Boolean> = new Map();
  tableHeads: Map<string, ITableHead> = new Map();
  hoveredTable: Table = new Table();
  hoveredTableHead: ITableHead = { attributes: [], rows: [] };
  test: Array<any> = [];

  displayedColumns: string[] = [
    'columnOne',
    'columnTwo',
    'columnThree',
    'columnFour',
    'columnFive',
  ];

  TABLE_EXAMPLE_DATA_SIMPLE = [
    {
      columnOne: 'columnOne',
      columnTwo: 'columnTwo',
      columnThree: 'columnThree',
      columnFour: 'columnFour',
      columnFive: 'columnFive',
    },
    {
      columnOne: 'columnOne',
      columnTwo: 'columnTwo',
      columnThree: 'columnThree',
      columnFour: 'columnFour',
      columnFive: 'columnFive',
    },
  ];

  dataSource: SbbTableDataSource<any> = new SbbTableDataSource(
    this.TABLE_EXAMPLE_DATA_SIMPLE
  );

  // eslint-disable-next-line no-unused-vars
  constructor(private dataService: DatabaseService) {}

  ngOnInit(): void {
    this.dataService.loadTableCallback$.subscribe((data) =>
      data.forEach((table) => this.tables.set(table, false))
    );
    this.dataService.loadTables();
    this.dataService
      .loadTableHeads()
      .subscribe((data) => (this.tableHeads = new Map(Object.entries(data))));
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
    console.log('enter');
    console.log(table.name);
    this.hoveredTable = table;
    this.hoveredTableHead = this.tableHeads.get(table.name)!;
    // this.test = this.hoveredTableHead.rows;
    console.log(this.hoveredTableHead);
  }
}
