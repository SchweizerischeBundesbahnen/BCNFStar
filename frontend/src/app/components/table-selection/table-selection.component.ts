import Table from '@/src/model/schema/Table';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import ITablePage from '@server/definitions/ITablePage';
import { DatabaseService } from 'src/app/database.service';
import { SbbTable } from '@sbb-esta/angular/table';
import { Router } from '@angular/router';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { MetanomeSettingsComponent } from '../metanome-settings/metanome-settings.component';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { firstValueFrom } from 'rxjs';
import { SchemaCreationService } from '../../schema-creation.service';
import Schema from '@/src/model/schema/Schema';
import { DataQuery, TablePreviewDataQuery } from '../../dataquery';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  @ViewChild(SbbTable) public table?: SbbTable<ITablePage>;
  @ViewChild('errorDialog') public errorDialog!: TemplateRef<any>;
  @ViewChild('loadingDialog') public loadingDialog!: TemplateRef<any>;

  @Input() public withContentPreview: boolean = true;
  @Output() public schema = new EventEmitter<Schema>();

  public loadingStatus: Map<IIndexFileEntry, 'done' | 'error' | 'loading'> =
    new Map();

  public hoveredTable?: Table;
  public tableColumns: Array<string> = [];
  public dataQuery?: DataQuery;

  public tables: Array<Table> = [];
  public selectedTables = new Map<Table, Boolean>();
  public tablesInSchema: Record<string, Table[]> = {};
  public error: any;
  public queueUrl: string;

  constructor(
    private dataService: DatabaseService,
    private schemaCreationService: SchemaCreationService,
    public router: Router,
    public dialog: SbbDialog,
    public metanomeDialog: SbbDialog
  ) {
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
    jobs.forEach((j) => this.loadingStatus.set(j.entry, 'loading'));

    for (const job of jobs) {
      try {
        const result = await job.promise;
        this.loadingStatus.set(job.entry, 'done');
        job.entry.fileName = result.fileName;
      } catch (e) {
        this.loadingStatus.set(job.entry, 'error');
      }
    }
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

    if (!values) return;

    this.loadingStatus.clear();

    const loadingDialog = this.dialog.open(this.loadingDialog);

    try {
      await this.runMetanome(
        Object.values(values).filter(
          (entry) => !entry.fileName && entry.algorithm != 'no-result'
        )
      );
      let fdResults = new Map<Table, string>();
      for (let [name, config] of Object.entries(values)) {
        if (name != 'ind')
          fdResults.set(
            [...this.tables].find((t) => t.fullName === config.tables[0])!,
            config.fileName
          );
      }
      const schema = await this.schemaCreationService.createSchema(
        tables,
        fdResults,
        values['ind'].fileName
      );
      this.schema.emit(schema);
    } catch (e) {
      this.error = e;
      console.error(e);
      this.dialog.open(this.errorDialog);
    } finally {
      loadingDialog.close();
    }
  }

  public mouseEnter(table: Table) {
    this.hoveredTable = table;
    this.dataQuery = new TablePreviewDataQuery(table);
  }
}
