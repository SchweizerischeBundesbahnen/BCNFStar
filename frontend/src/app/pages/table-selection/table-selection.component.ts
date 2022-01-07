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
    console.log('ngOnInit');
    // let tempTables = this.dataService.getTables();
    // tempTables.forEach((table) => this.tables.set(table, false));
    // this.dataService.loadTableCallback$.subscribe((data) =>
    //   data.forEach((table) => this.tables.set(table, false))
    // );
    let tempTables: Array<Table> = [];
    this.dataService.getAllTables().subscribe((data) => {
      tempTables.push(...data);
      console.log('Nach Table: ');
      console.log(tempTables);
      this.dataService.getFks().subscribe((data) => {
        this.dataService.resolveIFks(data, tempTables);
        tempTables.forEach((table) => this.tables.set(table, false));
        console.log('Nach fks: ');
        console.log(tempTables);
      });
    });
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
