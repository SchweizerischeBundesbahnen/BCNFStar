import Table from '@/src/model/schema/Table';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import {
  IIndexFileEntry,
  MetanomeResultType,
} from '@server/definitions/IIndexFileEntry';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../../database.service';
import { IHyFDConfig } from '@server/definitions/IHyFD';
import { INormiConfig } from '@server/definitions/INormi';
import { IBinderConfig } from '@server/definitions/IBinder';
import { IFaidaConfig } from '@server/definitions/IFaida';

@Component({
  selector: 'app-metanome-settings',
  templateUrl: './metanome-settings.component.html',
  styleUrls: ['./metanome-settings.component.css'],
})
export class MetanomeSettingsComponent {
  public oldMetanomeResults: Array<IIndexFileEntry> = [];
  public useOldMetanomeFdResult: Array<Boolean> = [];
  public useOldMetanomeIndResult = true;
  public selectedFdConfigs: Record<string, any> = {};
  public selectedIndConfig: any = {};
  public formGroup: FormGroup;

  public defaultHyFdConfig: IHyFDConfig = {
    INPUT_ROW_LIMIT: -1,
    ENABLE_MEMORY_GUARDIAN: true,
    NULL_EQUALS_NULL: true,
    VALIDATE_PARALLEL: true,
    MAX_DETERMINANT_SIZE: -1,
  };

  public defaultNormiConfig: INormiConfig = {
    isHumanInTheLoop: false,
  };

  public defaultBinderConfig: IBinderConfig = {
    DETECT_NARY: false,
    MAX_NARY_LEVEL: -1,
    CLEAN_TEMP: true,
    INPUT_ROW_LIMIT: -1,
    FILTER_KEY_FOREIGNKEYS: false,
    MAX_MEMORY_USAGE_PERCENTAGE: 60,
    TEMP_FOLDER_PATH: 'BINDER_temp',
    NUM_BUCKETS_PER_COLUMN: 10,
    MEMORY_CHECK_FREQUENCY: 100,
  };

  public defaultFaidaConfig: IFaidaConfig = {
    IGNORE_CONSTANT: true,
    VIRTUAL_COLUMN_STORE: false,
    HLL_REL_STD_DEV: 0.01,
    APPROXIMATE_TESTER: 'HLL',
    REUSE_COLUMN_STORE: false,
    SAMPLE_GOAL: 500,
    IGNORE_NULL: true,
    APPROXIMATE_TESTER_BYTES: 32768,
    DETECT_NARY: true,
  };

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
      this.selectedFdConfigs['fdConfig_' + table.schemaAndName()] = {};
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
  }

  public filteredMetanomeResultsForFd(table: Table) {
    return this.oldMetanomeResults.filter(
      (res) =>
        res.resultType === MetanomeResultType.fd &&
        res.tables[0] === table.schemaAndName()
    );
  }

  public filteredMetanomeResultsForInd() {
    return this.oldMetanomeResults.filter(
      (res) =>
        res.resultType === MetanomeResultType.ind &&
        this.tables.every((t) => res.tables.includes(t.schemaAndName()))
    );
  }

  public getAllTableNames() {
    return this.tables.map((table) => table.schemaAndName()).join(', ');
  }

  public isBoolean(value: any) {
    if (value.constructor.name == 'Boolean') {
      return true;
    }
    return false;
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

  public changeFdConfig(selectionValue: any) {
    switch (selectionValue.value) {
      case 'Normi': {
        this.selectedFdConfigs = this.defaultNormiConfig;
        break;
      }
      case 'HyFd': {
        this.selectedFdConfigs = this.defaultHyFdConfig;
        break;
      }
    }
  }

  public changeIndConfig(selectionValue: any) {
    switch (selectionValue.value) {
      case 'BINDER': {
        this.selectedIndConfig = this.defaultBinderConfig;
        break;
      }
      case 'FAIDA': {
        this.selectedIndConfig = this.defaultFaidaConfig;
        break;
      }
    }
  }

  public runMetoname() {
    console.log(this.formGroup.value);
    console.log('vor closen des Forms');
    this.dialogRef.close({ values: this.formGroup.value });
  }
}
