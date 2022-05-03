import Schema from '@/src/model/schema/Schema';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { SbbRadioGroup } from '@sbb-esta/angular/radio-button';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';
import Column from '@/src/model/schema/Column';
import { FdCluster } from '@/src/model/types/FdCluster';
import { TableRelationship } from '@/src/model/types/TableRelationship';

@Component({
  selector: 'app-schema-editing-side-bar',
  templateUrl: './schema-editing-side-bar.component.html',
  styleUrls: ['./schema-editing-side-bar.component.css'],
})
export class SchemaEditingSideBarComponent implements OnInit, OnChanges {
  @Input() public table!: Table;
  @Input() public schema!: Schema;
  @Output() public splitFd = new EventEmitter<FunctionalDependency>();
  @Output() public indToFk = new EventEmitter<TableRelationship>();
  @Output() public selectColumns = new EventEmitter<
    Map<Table, ColumnCombination>
  >();
  @Output() public renameTable = new EventEmitter<{
    table: Table;
    newName: string;
  }>();

  @ViewChild('indSelection', { read: SbbRadioGroup })
  private indSelectionGroup!: SbbRadioGroup;

  public _fdClusterFilter = new Array<Column>();
  public indFilter = new Array<Table>();

  public editingName = false;
  public tableName: string = '';

  public page: number = 0;
  public pageSize = 5;

  ngOnInit(): void {
    this.tableName = this.table.name;
  }

  ngOnChanges(): void {
    this.editingName = false;
    this._fdClusterFilter = [];
    this.indFilter = Array.from(this.schema.tables);
  }

  public selectedInd(): TableRelationship | undefined {
    if (!this.indSelectionGroup) return undefined;
    return this.indSelectionGroup.value;
  }

  public emitHighlightedInd(rel: TableRelationship) {
    const map = new Map<Table, ColumnCombination>();
    map.set(rel.referencing, rel.relationship.referencing());
    map.set(rel.referenced, rel.relationship.referenced());
    this.selectColumns.emit(map);
  }
  public emitHighlightedCluster(cluster: FdCluster) {
    const map = new Map<Table, ColumnCombination>();
    map.set(this.table, cluster.columns);
    this.selectColumns.emit(map);
  }

  public setTableName() {
    this.renameTable.emit({
      table: this.table,
      newName: this.tableName,
    });
    this.editingName = false;
  }

  public changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
  }

  public get fdClusterFilter(): ColumnCombination {
    return new ColumnCombination(...this._fdClusterFilter);
  }

  public fdClusters() {
    const cc = this.fdClusterFilter;
    return this.schema
      .splittableFdClustersOf(this.table)
      .filter((c) => cc.isSubsetOf(c.columns));
  }

  public inds() {
    return this.schema
      .indsOf(this.table)
      .filter((r) => this.indFilter.includes(r.referenced));
  }

  public transformIndToFk(): void {
    const ind = this.selectedInd();
    if (!ind) return;
    this.indToFk.emit(ind);
  }
}
