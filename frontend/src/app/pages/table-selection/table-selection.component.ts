import Table from '@/src/model/schema/Table';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import ITableHead from '@server/definitions/ITableHead';
import { DatabaseService } from 'src/app/database.service';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import { Router } from '@angular/router';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { MetanomeSettingsComponent } from '../../components/metanome-settings/metanome-settings.component';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  @ViewChild(SbbTable) public table?: SbbTable<ITableHead>;
  @ViewChild('errorDialog') public errorDialog!: TemplateRef<any>;
  @ViewChild('loadingDialog') loadingDialog!: TemplateRef<any>;

  public tableHeads: Map<Table, ITableHead> = new Map();
  public tableRowCounts: Map<Table, number> = new Map();
  public headLimit = 100;

  public loadingStatus: Map<IIndexFileEntry, 'done' | 'error' | 'loading'> =
    new Map();

  public hoveredTable?: Table;
  public tableColumns: Array<string> = [];
  public dataSource = new SbbTableDataSource<Record<string, any>>([]);

  public tables: Array<Table> = [];
  public selectedTables = new Map<Table, Boolean>();
  public tablesInSchema: Record<string, Table[]> = {};
  public error: any;
  public queueUrl: string;

  constructor(
    private dataService: DatabaseService,
    public router: Router,
    public dialog: SbbDialog,
    public metanomeDialog: SbbDialog
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
      this.tableRowCounts.set(table, rowCounts[table.schemaAndName()]);
      this.tableHeads.set(table, tableHeads[table.schemaAndName()]);
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

  public async runMetanome(entries: Array<IIndexFileEntry>) {
    const jobs = entries.map((entry) => {
      return { promise: this.dataService.runMetanome(entry), entry };
    });
    for (const job of jobs) {
      this.loadingStatus.set(job.entry, 'loading');
      try {
        const result = await job.promise;
        this.loadingStatus.set(job.entry, 'done');
        job.entry.fileName = result.fileName;
      } catch (e) {
        this.loadingStatus.set(job.entry, 'error');
      }
    }
    return Promise.allSettled(jobs.map((j) => j.promise)).catch(() => {});
  }

  public async selectTables() {
    const tables = this.tables.filter((table) =>
      this.selectedTables.get(table)
    );
    const dialogRef = this.dialog.open(MetanomeSettingsComponent, {
      data: tables,
    });
    const { values }: { values: Record<string, IIndexFileEntry> } =
      await firstValueFrom(dialogRef.afterClosed());

    const loadingDialog = this.dialog.open(this.loadingDialog);

    try {
      await this.runMetanome(
        Object.values(values).filter((entry) => !entry.fileName)
      );
      let fdResults: Record<string, string> = {};
      for (let value of Object.entries(values)) {
        if (value[0] != 'indResult') {
          fdResults[value[1].tables[0]] = value[1].fileName;
        }
      }
      await this.dataService.setInputTables(
        tables,
        values['indResult'].fileName,
        fdResults
      );
      this.router.navigate(['/edit-schema']);
    } catch (e) {
      this.error = e;
      this.dialog.open(this.errorDialog);
    } finally {
      loadingDialog.close();
    }
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
    this.table?.renderRows();
  }

  public mouseEnter(table: Table) {
    this.hoveredTable = table;
    this.getDataSourceAndRenderTable(table);
  }
}
