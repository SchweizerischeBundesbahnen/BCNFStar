import Table from '@/src/model/schema/Table';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import ITableHead from '@server/definitions/ITableHead';
import { DatabaseService } from 'src/app/database.service';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import { Router } from '@angular/router';
import { SbbDialog } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  @ViewChild(SbbTable) table!: SbbTable<ITableHead>;
  @ViewChild('errorDialog') errorDialog!: TemplateRef<any>;
  // public tables: Map<Table, Boolean> = new Map();
  public tableHeads: Map<Table, ITableHead> = new Map();
  public tableRowCounts: Map<Table, number> = new Map();
  public headLimit = 100;

  public hoveredTable?: Table;
  public tableColumns: Array<string> = [];
  public dataSource = new SbbTableDataSource<Record<string, any>>([]);

  public tables: Array<Table> = [];
  public selectedTables = new Map<Table, Boolean>();
  public tablesInSchema: Record<string, Table[]> = {};
  public isLoading = false;
  public error: any;
  public queueUrl: string;
  constructor(
    private dataService: DatabaseService,
    public router: Router,
    public dialog: SbbDialog
  ) {
    this.queueUrl = dataService.baseUrl + '/queue';
  }

  async ngOnInit(): Promise<void> {
    const tableHeadPrommise = this.dataService.loadTableHeads(this.headLimit);
    const rowCountPromise = this.dataService.loadTableRowCounts();
    this.tables = await this.dataService.loadTables();
    for (const table of this.tables) {
      this.selectedTables.set(table, false);
      if (!this.tablesInSchema[table.schemaName])
        this.tablesInSchema[table.schemaName] = [];
      this.tablesInSchema[table.schemaName].push(table);
    }

    const tableHeads = await tableHeadPrommise;
    const rowCounts = await rowCountPromise;

    for (const table of this.tables) {
      this.tableRowCounts.set(table, rowCounts[table.fullName]);
      this.tableHeads.set(table, tableHeads[table.fullName]);
    }
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
    this.dataService
      .setInputTables(tables)
      .then(() => {
        this.router.navigate(['/edit-schema']);
      })
      .catch((e) => {
        this.error = e;
        this.dialog.open(this.errorDialog);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private getDataSourceAndRenderTable(table: Table) {
    let hoveredTableHead = this.tableHeads.get(table);
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
