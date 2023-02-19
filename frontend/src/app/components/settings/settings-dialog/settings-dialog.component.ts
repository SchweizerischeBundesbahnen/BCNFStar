import Table from '@/src/model/schema/Table';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import { defaulHyfdConfig, hyfdAlgorithmName } from '@server/definitions/IHyFD';
import { defaultFaidaConfig, faidaAlgorithmName } from '@server/definitions/IFaida';
import { binderAlgorithmName, defaultBinderConfig } from '@server/definitions/IBinder';
import { defaultRustFdConfig, rustAlgorithmName } from '@server/definitions/IRustFd';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { DatabaseService } from '@/src/app/database.service';

import { JobWithoutTable, MetanoemSettingsRowResult } from "@/src/app/components/settings/settings-row/settings-row.component"
export type MetanomeSettings = Map<Table | 'ind', MetanoemSettingsRowResult>;
/**
 * Dialog where the users decides which metanome results to use per table.
 * The actual configuration is delegated to SettingsRowComponent, this just
 * sets up the initial config and the existing results.
 */
@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent {

  public fdConfigs: Record<string, JobWithoutTable> = { 'HyFD': { config: defaulHyfdConfig, algoClass: hyfdAlgorithmName }, 'RustFD': { config: defaultRustFdConfig, algoClass: rustAlgorithmName } }
  public indConfigs: Record<string, JobWithoutTable> = {
    'BINDER': { config: defaultBinderConfig, algoClass: binderAlgorithmName }, 'FAIDA': { config: defaultFaidaConfig, algoClass: faidaAlgorithmName }
  };

  public configs: MetanomeSettings = new Map()

  public overwriteConfig?: JobWithoutTable;

  public loadedExistingMetanomeResults = false;

  public existingIndResults: Array<IIndexFileEntry> = []
  public existingFdResults: Map<Table, Array<IIndexFileEntry>> = new Map()

  constructor(public dialogRef: SbbDialogRef<SettingsDialogComponent, MetanomeSettings>,
    @Inject(SBB_DIALOG_DATA) public tables: Array<Table>,
    private http: HttpClient,
    private dataService: DatabaseService) {
    this.loadExistingMetanomeResults()
    this.tables.forEach(t => this.existingFdResults.set(t, []))
  }

  public runMetanome() {
    this.dialogRef.close(this.configs);
  }

  public getAllTableNames() {
    return this.tables
      .map((table) => table.fullName)
      .sort()
      .join(', ');
  }

  public async loadExistingMetanomeResults() {
    const existingMetanomeResults = (await firstValueFrom(
      this.http.get<Array<IIndexFileEntry>>(
        this.dataService.baseUrl + '/metanomeResults'
      ))).sort(function (table, otherTable) {
        return otherTable.createDate - table.createDate;
      })

    existingMetanomeResults
      .filter((res) => res.resultType === 'FunctionalDependency'
      ).forEach(entry => {
        const table = this.tables.find(t => entry.schemaAndTables.includes(t.fullName))
        if(table) this.existingFdResults.get(table)?.push(entry);
      })

    this.existingIndResults = existingMetanomeResults
      .filter(
        (res) =>
          res.resultType === 'InclusionDependency' &&
          this.tables.every((t) => res.schemaAndTables.includes(t.fullName))
      )
    this.loadedExistingMetanomeResults = true;
  }
}