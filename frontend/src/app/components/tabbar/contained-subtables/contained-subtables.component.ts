import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import Table from '@/src/model/schema/Table';
import { FdCluster } from '@/src/model/types/FdCluster';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';

@Component({
  selector: 'app-contained-subtables',
  templateUrl: './contained-subtables.component.html',
  styleUrls: ['./contained-subtables.component.css'],
})
export class ContainedSubtablesComponent implements OnChanges {
  @Input() public table!: Table;
  @Output() public selectColumns = new EventEmitter<
    Map<Table, ColumnCombination>
  >();
  @Output() public splitFd = new EventEmitter<FunctionalDependency>();
  public _fdClusterFilter = new Array<Column>();
  public page: number = 0;
  public pageSize = 5;

  constructor() {}

  ngOnChanges(): void {
    this._fdClusterFilter = [];
  }

  public emitHighlightedCluster(cluster: FdCluster) {
    console.log('highlight');
    const map = new Map<Table, ColumnCombination>();
    map.set(this.table, cluster.columns);
    this.selectColumns.emit(map);
  }

  public changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
  }

  public get fdClusterFilter(): ColumnCombination {
    return new ColumnCombination(this._fdClusterFilter);
  }

  public fdClusters(): Array<FdCluster> {
    const cc = this.fdClusterFilter;
    return this.table
      .fdClusters()
      .filter((cluster) => cc.isSubsetOf(cluster.columns));
  }
}
