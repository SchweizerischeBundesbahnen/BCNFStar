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
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent implements OnInit, OnChanges {
  @Input() table!: Table;
  @Input() schema!: Schema;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();
  @Output() indToFk = new EventEmitter<TableRelationship>();
  @Output() selectColumns = new EventEmitter<Map<Table, ColumnCombination>>();
  @Output() renameTable = new EventEmitter<{
    table: Table;
    newName: string;
  }>();

  @ViewChild('indSelection', { read: SbbRadioGroup })
  indSelectionGroup!: SbbRadioGroup;

  _fdClusterFilter = new Array<Column>();
  indFilter = new Array<Table>();

  public editingName = false;
  public tableName: string = '';

  page: number = 0;
  pageSize = 5;

  ngOnInit(): void {
    this.tableName = this.table.name;
  }

  ngOnChanges(): void {
    this.editingName = false;
    this._fdClusterFilter = [];
    this.indFilter = Array.from(this.schema.tables);
  }

  selectedInd(): TableRelationship | undefined {
    if (!this.indSelectionGroup) return undefined;
    return this.indSelectionGroup.value;
  }

  emitHighlightedInd(rel: TableRelationship) {
    const map = new Map<Table, ColumnCombination>();
    map.set(rel.referencing, rel.relationship.referencing());
    map.set(rel.referenced, rel.relationship.referenced());
    this.selectColumns.emit(map);
  }
  emitHighlightedCluster(cluster: FdCluster) {
    const map = new Map<Table, ColumnCombination>();
    map.set(this.table, cluster.columns);
    this.selectColumns.emit(map);
  }

  setTableName() {
    this.renameTable.emit({
      table: this.table,
      newName: this.tableName,
    });
    this.editingName = false;
  }
  changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
  }

  get fdClusterFilter(): ColumnCombination {
    return new ColumnCombination(...this._fdClusterFilter);
  }

  fdClusters() {
    const cc = this.fdClusterFilter;
    return this.schema
      .splittableFdClustersOf(this.table)
      .filter((c) => cc.isSubsetOf(c.columns));
  }

  inds() {
    return this.schema
      .indsOf(this.table)
      .filter((r) => this.indFilter.includes(r.referenced));
  }

  transformIndToFk(): void {
    const ind = this.selectedInd();
    if (!ind) return;
    this.indToFk.emit(ind);
  }
}
