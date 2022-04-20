import Table from '@/src/model/schema/Table';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
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

  public formGroup: FormGroup;
  public selectedFdTab: Array<FormControl> = [
    new FormControl('existing-result'),
  ];
  public selectedIndTab: FormControl = new FormControl('existing-result');

  public defaultHyFdConfig: MetanomeConfig = {
    INPUT_ROW_LIMIT: -1,
    ENABLE_MEMORY_GUARDIAN: true,
    NULL_EQUALS_NULL: true,
    VALIDATE_PARALLEL: true,
    MAX_DETERMINANT_SIZE: -1,
    memory: '',
  };

  public defaultNormiConfig: MetanomeConfig = {
    isHumanInTheLoop: false,
    memory: '',
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
    memory: '',
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
    memory: '',
  };

  public normiConfigs: Record<string, IIndexFileEntry> = {};
  public hyfdConfigs: Record<string, IIndexFileEntry> = {};
  public binderConfigs: Record<string, IIndexFileEntry> = {
    ind: this.createDefaultIndIndexFile(
      Object.assign({}, this.defaultBinderConfig),
      'de.metanome.algorithms.binder.BINDERFile'
    ),
  };
  public faidaConfigs: Record<string, IIndexFileEntry> = {
    ind: this.createDefaultIndIndexFile(
      Object.assign({}, this.defaultFaidaConfig),
      'de.hpi.mpss2015n.approxind.FAIDA'
    ),
  };

  constructor(
    public dialogRef: SbbDialogRef<MetanomeSettingsComponent>,
    public formBuilder: FormBuilder,
    @Inject(SBB_DIALOG_DATA) public tables: Array<Table>,
    public dataService: DatabaseService,
    private http: HttpClient
  ) {
    let controlsConfig: Record<string, any> = {};
    controlsConfig['ind'] = {};

    tables.forEach((table) => {
      this.normiConfigs['fds_' + table.schemaAndName()] =
        this.createDefaultFdIndexFile(
          Object.assign({}, this.defaultNormiConfig),
          'de.metanome.algorithms.normalize.Normi',
          table.schemaAndName()
        );
      this.hyfdConfigs['fds_' + table.schemaAndName()] =
        this.createDefaultIndIndexFile(
          Object.assign({}, this.defaultHyFdConfig),
          'de.metanome.algorithms.hyfd.HyFD'
        );
      controlsConfig['fds_' + table.schemaAndName()] = {};
    });

    this.formGroup = formBuilder.group(controlsConfig);
    this.loadOldMetanomeResults();
  }

  public async loadOldMetanomeResults() {
    await firstValueFrom(
      this.http.get<Array<IIndexFileEntry>>(
        this.dataService.baseUrl + '/metanomeResults'
      )
    ).then((result) => {
      this.oldMetanomeResults = result;
      this.tables.forEach((table) => {
        this.formGroup.patchValue({
          ['fds_' + table.schemaAndName()]:
            this.filteredMetanomeResultsForFd(table)[0],
        });
      });
      this.formGroup.patchValue({
        ind: this.filteredMetanomeResultsForInd()[0],
      });
      this.formGroup.updateValueAndValidity();
    });
  }

  public createDefaultFdIndexFile(
    config: MetanomeConfig,
    algorithm: string,
    tableName: string
  ): IIndexFileEntry {
    let newIndexFileEntry: IIndexFileEntry = {
      config,
      tables: [tableName],
      dbmsName: '',
      database: '',
      resultType: MetanomeResultType.fd,
      algorithm,
      fileName: '',
      createDate: 0,
    };
    return newIndexFileEntry;
  }

  public createDefaultIndIndexFile(
    config: MetanomeConfig,
    algorithm: string
  ): IIndexFileEntry {
    let newIndexFileEntry: IIndexFileEntry = {
      tables: this.tables.map((table) => table.name),
      dbmsName: '',
      database: '',
      resultType: MetanomeResultType.ind,
      algorithm,
      fileName: '',
      config,
      createDate: 0,
    };
    return newIndexFileEntry;
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
    return typeof value == 'boolean';
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

  public onFdToggleBarChange(event: any, table: Table) {
    // console.log("event", event, 'table', table)
    switch (event.value) {
      case 'existing-result':
        this.formGroup.patchValue({
          ['fds_' + table.schemaAndName()]:
            this.filteredMetanomeResultsForFd(table)[0],
        });
        break;
      case 'normi':
        this.formGroup.patchValue({
          ['fds_' + table.schemaAndName()]:
            this.normiConfigs['fds_' + table.schemaAndName()],
        });
        break;
      case 'hyfd':
        this.formGroup.patchValue({
          ['fds_' + table.schemaAndName()]:
            this.hyfdConfigs['fds_' + table.schemaAndName()],
        });
        break;
    }
    this.formGroup.updateValueAndValidity();
  }

  public onIndToggleBarChange(event: any) {
    switch (event.value) {
      case 'existing-result':
        this.formGroup.patchValue({
          ind: this.filteredMetanomeResultsForInd()[0],
        });
        break;
      case 'binder':
        this.formGroup.patchValue({
          ind: this.binderConfigs['ind'],
        });
        break;
      case 'faida':
        this.formGroup.patchValue({
          ind: this.faidaConfigs['ind'],
        });
        break;
    }
    this.formGroup.updateValueAndValidity();
  }

  public runMetoname() {
    console.log(this.formGroup.value);
    this.dialogRef.close({ values: this.formGroup.value });
  }
}
