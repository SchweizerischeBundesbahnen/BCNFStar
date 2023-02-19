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
import { MetanomeSettings, SettingsDialogComponent } from '../settings/settings-dialog/settings-dialog.component';
import { isIIndexFileEntry } from '@server/definitions/IIndexFileEntry.guard';
import { firstValueFrom } from 'rxjs';
import { SchemaCreationService } from '../../schema-creation.service';
import Schema from '@/src/model/schema/Schema';
import { DataQuery, TablePreviewDataQuery } from '../../dataquery';
import { IMetanomeJob } from '@server/definitions/IMetanomeJob';
import { isIMetanomeJob } from '@server/definitions/IMetanomeJob.guard';

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

  public loadingStatus: Map<IMetanomeJob, 'done' | 'error' | 'loading'> =
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
    this.tables = await this.dataService.getTables();

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
    const shouldAllBeSelected = !this.areAllSelectedIn(schema)
    this.tablesInSchema[schema].forEach((table) =>
      this.selectedTables.set(table, shouldAllBeSelected)
    );
  }

  public areAllSelectedIn(schema: string) {
    return this.tablesInSchema[schema].every((table) =>
      this.selectedTables.get(table)
    );
  }

  public areZeroSelectedIn(schema: string) {
    return this.tablesInSchema[schema].every((table) =>
      !this.selectedTables.get(table)
    );
  }

  /**
   * 
   * @param job 
   * @returns filename of the resulting file
   */
  public async runMetanome(job: IMetanomeJob): Promise<string | null> {

    const promise = this.dataService.runMetanome(job)
    this.loadingStatus.set(job, 'loading')

    try {
      const result = await promise;
      this.loadingStatus.set(job, 'done');
      return result.fileName;
    } catch (e) {
      this.loadingStatus.set(job, 'error');
      return null;
    }
  }

  public async selectTables() {
    const tables = this.tables.filter((table) =>
      this.selectedTables.get(table)
    );
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      data: tables,
    });
    const settings: MetanomeSettings = await firstValueFrom(dialogRef.afterClosed())

    if (!settings) return;

    this.loadingStatus.clear();

    const loadingDialog = this.dialog.open(this.loadingDialog);

    try {

      const fdFiles: Map<Table, string> = new Map();
      let indFile: string | undefined;
      // we handle the promises with .then, this is just for synchronisation
      const promises: Array<Promise<unknown>> = []

      settings.forEach(async (job, table) => {
        const set = (filename: string) => table === 'ind' ? indFile = filename : fdFiles.set(table, filename)
        if (isIIndexFileEntry(job)) {
          set(job.fileName)
        } else if (isIMetanomeJob(job)) {
          const filenamePromise = this.runMetanome(job)
          promises.push(filenamePromise)
          filenamePromise.then((filename) => { if (filename) set(filename) })
        }
      })
      await Promise.all(promises)
      const schema = await this.schemaCreationService.createSchema(
        tables,
        fdFiles,
        indFile
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
