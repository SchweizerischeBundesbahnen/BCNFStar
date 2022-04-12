import Table from '@/src/model/schema/Table';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../../database.service';

@Component({
  selector: 'app-metanome-settings',
  templateUrl: './metanome-settings.component.html',
  styleUrls: ['./metanome-settings.component.css'],
})
export class MetanomeSettingsComponent {
  public oldMetanomeResults: Array<IIndexFileEntry> = [];
  public useOldMetanomeFdResult: Array<Boolean> = [];
  public useOldMetanomeIndResult = true;

  constructor(
    public dialogRef: SbbDialogRef<MetanomeSettingsComponent>,
    @Inject(SBB_DIALOG_DATA) public tables: Array<Table>,
    public dataService: DatabaseService,
    private http: HttpClient
  ) {
    this.loadOldMetanomeResults();
    tables.forEach(() => this.useOldMetanomeFdResult.push(true));
  }

  public async loadOldMetanomeResults() {
    this.oldMetanomeResults = await firstValueFrom(
      this.http.get<Array<IIndexFileEntry>>(
        this.dataService.baseUrl + '/metanomeResults'
      )
    );
    console.log(this.oldMetanomeResults);
  }

  public filteredMetanomeResultsForFd(table: Table) {
    return this.oldMetanomeResults.filter(
      (res) =>
        res.tables.length == 1 && res.tables.includes(table.schemaAndName())
    );
  }

  public filteredMetanomeResultsForInd() {
    return this.oldMetanomeResults.filter((res) => {
      let tableNames = this.tables.map((table) => table.schemaAndName());
      return tableNames.sort().join(',') == res.tables.sort().join(',');
    });
  }

  public getAllTableNames() {
    return this.tables.map((table) => table.schemaAndName()).join(', ');
  }

  public getMetanomeConfigurationInformation(result: IIndexFileEntry) {
    let settings = [
      new Date(+result.createDate).toLocaleString(),
      result.algorithm.split('.').slice(-1),
      Object.entries(result.config)
        .join(';')
        .replace(',', ': ')
        .replace(';', ', ') || 'no further configs',
    ];
    return settings.join(' | ');
  }

  public toggleFdResult(index: number) {
    this.useOldMetanomeFdResult[index] = !this.useOldMetanomeFdResult[index];
  }

  public toggleIndResult() {
    this.useOldMetanomeIndResult = !this.useOldMetanomeIndResult;
  }
}
