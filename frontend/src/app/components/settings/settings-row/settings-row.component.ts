import Table from '@/src/model/schema/Table';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { IMetanomeConfig } from '@server/definitions/IMetanomeConfig';
import { IMetanomeJob } from '@server/definitions/IMetanomeJob';

export type JobWithoutTable = Omit<IMetanomeJob, 'schemaAndTables'>;

export type MetanoemSettingsRowResult = IMetanomeJob | IIndexFileEntry | null;

/**
 * Creates the configuration menu for a single table (FD) or INDs.
 * Builds config options based on the defaultConfigs
 */
@Component({
  selector: 'app-settings-row',
  templateUrl: './settings-row.component.html',
  styleUrls: ['./settings-row.component.css']
})
export class SettingsRowComponent implements OnInit, OnChanges {

  @Input() public tables!: Array<Table>;
  // Record<AlgorithmName, {algoClass, config}
  @Input() public defaultConfigs!: Record<string, JobWithoutTable>;
  @Input() public existingResults: Array<IIndexFileEntry> = [];

  // when one table emits applyToAllTables, the fd config should be set to overwriteConfig
  @Input() public overwriteConfig?: JobWithoutTable;
  @Output() public applyToAllTables = new EventEmitter<JobWithoutTable>()

  @Output() public config = new EventEmitter<MetanoemSettingsRowResult>()

  public tabControl = new FormControl('no-result');
  public algoFormGroups: Record<string, FormGroup> = {}
  public existingResultsControl = new FormControl();
  public formGroup: FormGroup = new FormGroup({});

  public readonly algoTooltips: Record<string, string> = {
    HyFD: 'Fastest Metanome algorithm without approximations to find FDs',
    BINDER: 'Slower than FAIDA, but guaranteed to produce correct results',
    FAIDA: 'Recommended. Very fast, but approximate. Never produces false negatives, but might produce some false positives on small datasets.'
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['overwriteConfig'] && this.overwriteConfig) {
      const algoName = Object.entries(this.defaultConfigs).find(([, job]) => job.algoClass === this.overwriteConfig?.algoClass)![0]
      this.tabControl.setValue(algoName)
      this.algoFormGroups[algoName].setValue(this.overwriteConfig.config)
    }
  }

  ngOnInit() {
    // Set initially opened tab
    if (this.existingResults.length > 0) {
      this.tabControl.setValue('existing-result')
      this.existingResultsControl.setValue(this.existingResults[0])
    }
    else
      this.tabControl.setValue(Object.keys(this.defaultConfigs)[0])

    // Build FormControls for child SettingsElementComponent based on defaultConfigs
    for (const algo in this.defaultConfigs) {
      const algoFromControls: Record<string, FormControl> = {}
      for (const setting in this.defaultConfigs[algo].config) {
        algoFromControls[setting] = new FormControl(this.defaultConfigs[algo].config[setting])
      }

      this.algoFormGroups[algo] = new FormGroup(algoFromControls)
    }

    // update the settings in setting-dialog initially and whenever something changes
    this.formGroup = new FormGroup(this.algoFormGroups)
    
    this.emitConfig()
    this.formGroup.valueChanges.subscribe(() => this.emitConfig())
    this.tabControl.valueChanges.subscribe(() => this.emitConfig())
  }

  /**
   * @param result an existing metanome result
   * @returns Human-readable string to show users what settings apply to an existing result 
   */
  public existingResultInfo(result: IIndexFileEntry): string {
    let settings = [
      new Date(result.createDate).toLocaleString(),
      result.algoClass.split('.').slice(-1),
      Object.entries(result.config)
        .map(([configName, configValue]) =>
          [configName, configValue === '' ? '?' : configValue]
        )
        .join(',')
        .replaceAll(',', ': ')
        .replaceAll(';', ', ') || 'no further configs',
    ];
    return settings.join(' | ');
  }

  /**
   * Gets whenever any config changes. Emits the current config to the parent
   */
  private emitConfig() {
    switch (this.tabControl.value) {
      case 'no-result':
        this.config.emit()
        break;
      case 'existing-result':
        this.config.emit(this.existingResultsControl.value)
        break;
      default:
        this.config.emit(Object.assign({ schemaAndTables: this.tableNames() }, this.currentJobWithoutTable()) as IMetanomeJob)
    }
  }

  public currentJobWithoutTable(): JobWithoutTable {
    const algo: string = this.tabControl.value;
    const config: IMetanomeConfig = this.formGroup.get(algo)?.value
    return { algoClass: this.defaultConfigs[algo].algoClass, config }
  }
  public tableNames(): string[] {
    return this.tables.map(t => t.fullName);
  }

  public controlsFor(algo: string): Record<string, FormControl> {
    return this.algoFormGroups[algo].controls as Record<string, FormControl>
  }
}
