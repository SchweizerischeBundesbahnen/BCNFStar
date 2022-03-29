import Table from '@/src/model/schema/Table';
import { Component, OnInit, ViewChild } from '@angular/core';
import ITableHead from '@server/definitions/ITableHead';
import { DatabaseService } from 'src/app/database.service';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  @ViewChild(SbbTable) table!: SbbTable<ITableHead>;
  // public tables: Map<Table, Boolean> = new Map();
  public tableHeads: Map<string, ITableHead> = new Map();
  public tableRowCounts: Map<string, number> = new Map();
  public headLimit: number = 100;

  public hoveredTable: Table = new Table();
  public tableColumns: string[] = [];
  public dataSource: SbbTableDataSource<any> = new SbbTableDataSource<any>([]);

  public tables: Array<Table> = [];
  public selectedTables = new Map<Table, Boolean>();
  public tablesInSchema: Record<string, Table[]> = {};
  public isLoading = false;
  public queueUrl: string;
  constructor(private dataService: DatabaseService, private router: Router) {
    this.router = router;
    this.queueUrl = dataService.baseUrl + '/queue';
  }

  async ngOnInit(): Promise<void> {
    this.tables = await this.dataService.loadTables();
    for (const table of this.tables) {
      this.selectedTables.set(table, false);
      if (!this.tablesInSchema[table.schemaName])
        this.tablesInSchema[table.schemaName] = [];
      this.tablesInSchema[table.schemaName].push(table);
    }
    const tableHeads = await this.dataService.loadTableHeads(this.headLimit);
    this.tableHeads = new Map(Object.entries(tableHeads));
    const rowCounts = await this.dataService.loadTableRowCounts();
    this.tableRowCounts = new Map(Object.entries(rowCounts));
  }

  public hasSelectedTables(): boolean {
    return [...this.selectedTables.values()].some((bool) => bool);
  }

  public clickSelectAll(schema: string) {
    if (this.areAllSelectedIn(schema)) {
      this.tablesInSchema[schema].forEach((table) =>
        this.selectedTables.set(table, false)
      );
    } else
      this.tablesInSchema[schema].forEach((table) =>
        this.selectedTables.set(table, true)
      );
  }

  public areAllSelectedIn(schema: string) {
    return this.tablesInSchema[schema].every((table) =>
      this.selectedTables.get(table)
    );
  }

  public areZeroSelectedIn(schema: string) {
    return !this.tablesInSchema[schema].some((table) =>
      this.selectedTables.get(table)
    );
  }

  public selectTables() {
    const tables = this.tables.filter((table) =>
      this.selectedTables.get(table)
    );
    this.isLoading = true;
    this.dataService.setInputTables(tables).then(() => {
      this.isLoading = false;
      this.router.navigate(['/edit-schema']);
    });
  }

  private getDataSourceAndRenderTable(table: Table) {
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

  public mouseEnter(table: Table) {
    this.hoveredTable = table;
    this.getDataSourceAndRenderTable(table);
  }
}
