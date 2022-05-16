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
import { defaulHyfdConfig, hyfdAlgorithmName } from '@server/definitions/IHyFD';
import {
  binderAlgorithmName,
  defaultBinderConfig,
} from '@server/definitions/IBinder';
import {
  defaultFaidaConfig,
  faidaAlgorithmName,
} from '@server/definitions/IFaida';
import { IMetanomeConfig } from '@server/definitions/IMetanomeConfig';

@Component({
  selector: 'app-metanome-settings',
  templateUrl: './metanome-settings.component.html',
  styleUrls: ['./metanome-settings.component.css'],
})
export class MetanomeSettingsComponent {
  public oldMetanomeResults: Array<IIndexFileEntry> = [];

  public formGroup: FormGroup;
  public selectedFdTab: Array<FormControl> = [];
  public selectedIndTab: FormControl = new FormControl('binder');

  public hyfdConfigs: Record<string, IIndexFileEntry> = {};
  public binderConfigs: Record<string, IIndexFileEntry> = {
    ind: this.createDefaultIndIndexFile(
      Object.assign({}, defaultBinderConfig),
      binderAlgorithmName
    ),
  };
  public faidaConfigs: Record<string, IIndexFileEntry> = {
    ind: this.createDefaultIndIndexFile(
      Object.assign({}, defaultFaidaConfig),
      faidaAlgorithmName
    ),
  };

  public configTooltip = {
    memory:
      'Java memory string, e.g. 512M or 4G. If empty: 75% of total memory.',
  };

  constructor(
    public dialogRef: SbbDialogRef<MetanomeSettingsComponent>,
    public formBuilder: FormBuilder,
    @Inject(SBB_DIALOG_DATA) public tables: Array<Table>,
    public dataService: DatabaseService,
    private http: HttpClient
  ) {
    this.tables.sort((table, anotherTable) =>
      table.schemaAndName() <= anotherTable.schemaAndName() ? -1 : 1
    );
    let controlsConfig: Record<string, any> = {};
    controlsConfig['ind'] = {};

    tables.forEach((table) => {
      this.selectedFdTab.push(new FormControl('hyfd'));

      this.hyfdConfigs['fds_' + table.schemaAndName()] =
        this.createDefaultFdIndexFile(
          table.schemaAndName(),
          Object.assign({}, defaulHyfdConfig),
          hyfdAlgorithmName
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

      this.tables.forEach((table, index) => {
        const existingFdResult = this.filteredMetanomeResultsForFd(table)[0];
        if (existingFdResult) {
          this.selectedFdTab[index].setValue('existing-result');
        }
        this.setFdConfig(table);
      });

      const existingIndResult = this.filteredMetanomeResultsForInd()[0];
      if (existingIndResult) {
        this.selectedIndTab.setValue('existing-result');
      }
      this.setIndConfig();

      this.formGroup.updateValueAndValidity();
    });
  }

  public createDefaultFdIndexFile(
    tableName: string,
    config: IMetanomeConfig = Object.assign({}, defaulHyfdConfig),
    algorithm: string = hyfdAlgorithmName
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
    config: IMetanomeConfig = Object.assign({}, defaultBinderConfig),
    algorithm: string = binderAlgorithmName
  ): IIndexFileEntry {
    let newIndexFileEntry: IIndexFileEntry = {
      tables: this.tables.map((table) => table.schemaAndName()).sort(),
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
    return this.oldMetanomeResults
      .filter(
        (res) =>
          res.resultType === MetanomeResultType.fd &&
          res.tables[0] === table.schemaAndName()
      )
      .sort(function (table, otherTable) {
        return otherTable.createDate - table.createDate;
      });
  }

  public filteredMetanomeResultsForInd() {
    return this.oldMetanomeResults
      .filter(
        (res) =>
          res.resultType === MetanomeResultType.ind &&
          this.tables.every((t) => res.tables.includes(t.schemaAndName()))
      )
      .sort(function (table, otherTable) {
        return otherTable.createDate - table.createDate;
      });
  }

  public getAllTableNames() {
    return this.tables
      .map((table) => table.schemaAndName())
      .sort()
      .join(', ');
  }

  public isBoolean(value: any) {
    return typeof value == 'boolean';
  }

  public metanomeConfigInfo(result: IIndexFileEntry): string {
    let settings = [
      new Date(+result.createDate).toLocaleString(),
      result.algorithm.split('.').slice(-1),
      Object.entries(result.config)
        .join(';')
        .replaceAll(',', ': ')
        .replaceAll(';', ', ') || 'no further configs',
    ];
    return settings.join(' | ');
  }

  public setFdConfig(table: Table) {
    const tab: string = this.selectedFdTab[this.tables.indexOf(table)].value;
    switch (tab) {
      case 'no-result':
        this.formGroup.patchValue({
          ['fds_' + table.schemaAndName()]: this.createDefaultFdIndexFile(
            table.schemaAndName(),
            Object.assign({}, { memory: '' }),
            'no-result'
          ),
        });
        break;
      case 'existing-result':
        this.formGroup.patchValue({
          ['fds_' + table.schemaAndName()]:
            this.filteredMetanomeResultsForFd(table)[0],
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

  public setIndConfig() {
    const tab: string = this.selectedIndTab.value;
    switch (tab) {
      case 'no-result':
        this.formGroup.patchValue({
          ind: this.createDefaultIndIndexFile(
            Object.assign({}, { memory: '' }),
            'no-result'
          ),
        });
        break;
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

  public applySettingToAllOtherTables(configName: string) {
    for (let key of Object.keys(this.hyfdConfigs)) {
      this.hyfdConfigs[key]['config'] = Object.assign(
        {},
        this.hyfdConfigs[configName]['config']
      );
    }
  }

  /**
   * solves problem of writing in input without lost of focus
   * solution explained in: https://stackoverflow.com/questions/42322968/angular2-dynamic-input-field-lose-focus-when-input-changes
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public trackByFn(key: any, value: any) {
    return key;
  }

  public runMetanome() {
    this.dialogRef.close({ values: this.formGroup.value });
  }
}
