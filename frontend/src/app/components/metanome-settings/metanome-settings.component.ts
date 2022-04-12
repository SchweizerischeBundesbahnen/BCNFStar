import Table from '@/src/model/schema/Table';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
  public formGroup: FormGroup;

  constructor(
    public dialogRef: SbbDialogRef<MetanomeSettingsComponent>,
    public formBuilder: FormBuilder,
    @Inject(SBB_DIALOG_DATA) public tables: Array<Table>,
    public dataService: DatabaseService,
    private http: HttpClient
  ) {
    let controlsConfig: Record<string, Array<any>> = {};
    tables.forEach((table) => {
      this.useOldMetanomeFdResult.push(true);
      controlsConfig['fdResult_' + table.schemaAndName()] = [];
    });
    controlsConfig['indResult'] = [];

    this.formGroup = formBuilder.group(controlsConfig);
    this.loadOldMetanomeResults();
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

  public runMetoname() {
    console.log(this.formGroup.value);
    console.log('vor closen des Forms');
    this.dialogRef.close({ values: this.formGroup.value });
  }
}
