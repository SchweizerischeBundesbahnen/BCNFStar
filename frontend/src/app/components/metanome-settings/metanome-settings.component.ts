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
import { MetanomeConfig } from '@server/definitions/IMetanomeJob';

@Component({
  selector: 'app-metanome-settings',
  templateUrl: './metanome-settings.component.html',
  styleUrls: ['./metanome-settings.component.css'],
})
export class MetanomeSettingsComponent {
  public oldMetanomeResults: Array<IIndexFileEntry> = [];
  public useOldMetanomeFdResult: Record<string, Boolean> = {};
  public useOldMetanomeIndResult = true;
  public formGroup: FormGroup;

  public defaultHyFdConfig: MetanomeConfig = {
    INPUT_ROW_LIMIT: -1,
    ENABLE_MEMORY_GUARDIAN: true,
    NULL_EQUALS_NULL: true,
    VALIDATE_PARALLEL: true,
    MAX_DETERMINANT_SIZE: -1,
  };

  public defaultNormiConfig: MetanomeConfig = {
    isHumanInTheLoop: false,
  };

  public defaultBinderConfig: MetanomeConfig = {
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

  public defaultFaidaConfig: MetanomeConfig = {
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

  public selectedFdConfigs: Record<string, MetanomeConfig> = {};
  public selectedIndConfig: MetanomeConfig = this.defaultBinderConfig;

  constructor(
    public dialogRef: SbbDialogRef<MetanomeSettingsComponent>,
    public formBuilder: FormBuilder,
    @Inject(SBB_DIALOG_DATA) public tables: Array<Table>,
    public dataService: DatabaseService,
    private http: HttpClient
  ) {
    let controlsConfig: Record<string, Array<any>> = {};
    tables.forEach((table) => {
      this.useOldMetanomeFdResult['fds_' + table.schemaAndName()] = true;
      controlsConfig['fds_' + table.schemaAndName()] = [];
      this.selectedFdConfigs['fds_' + table.schemaAndName()] =
        this.defaultNormiConfig;
    });
    controlsConfig['inds'] = [];
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

  public toggleFdResult(tableName: string) {
    this.useOldMetanomeFdResult[tableName] =
      !this.useOldMetanomeFdResult[tableName];
  }

  public toggleIndResult() {
    this.useOldMetanomeIndResult = !this.useOldMetanomeIndResult;
  }

  public changeFdConfig(algorithm: string, tableName: string) {
    switch (algorithm.split('.').slice(-1)[0]) {
      case 'Normi': {
        this.selectedFdConfigs[tableName] = this.defaultNormiConfig;
        break;
      }
      case 'HyFD': {
        this.selectedFdConfigs[tableName] = this.defaultHyFdConfig;
        break;
      }
    }
  }

  public changeIndConfig(selectionValue: any) {
    switch (selectionValue.value.algorithm.split('.').slice(-1)[0]) {
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

  public buildNewFdConfig(algorithm: string, tableName: string) {
    let newIndexFileEntry: IIndexFileEntry = {
      config: this.selectedFdConfigs[tableName],
      tables: [tableName.slice(4)],
      dbmsName: '',
      database: '',
      resultType: MetanomeResultType.fd,
      algorithm: algorithm,
      fileName: '',
      createDate: 0,
    };
    this.formGroup.value[tableName] = newIndexFileEntry;
    return newIndexFileEntry;
  }

  public buildNewIndConfig(algorithm: string) {
    let newIndexFileEntry: IIndexFileEntry = {
      tables: this.tables.map((table) => table.name),
      dbmsName: '',
      database: '',
      resultType: MetanomeResultType.fd,
      algorithm: algorithm,
      fileName: '',
      config: this.selectedIndConfig,
      createDate: 0,
    };
    return newIndexFileEntry;
  }

  public runMetoname() {
    this.dialogRef.close({ values: this.formGroup.value });
  }
}
