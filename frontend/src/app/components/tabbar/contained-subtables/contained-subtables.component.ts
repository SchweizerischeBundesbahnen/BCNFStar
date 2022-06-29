import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import Table from '@/src/model/schema/Table';
import { FdCluster } from '@/src/model/types/FdCluster';
import { Component } from '@angular/core';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';

@Component({
  selector: 'app-contained-subtables',
  templateUrl: './contained-subtables.component.html',
  styleUrls: ['./contained-subtables.component.css'],
})
export class ContainedSubtablesComponent {
  public _fdClusterFilter = new Array<Column>();
  public page: number = 0;
  public pageSize = 5;

  constructor(public schemaService: SchemaService) {
    this.schemaService.selectedTableChanged.subscribe(() => {
      this._fdClusterFilter = [];
    });
  }

  public get table() {
    return this.schemaService.selectedTable!;
  }

  public emitHighlightedCluster(cluster: FdCluster) {
    console.log('highlight');
    const map = new Map<Table, ColumnCombination>();
    map.set(this.table, cluster.columns);
    this.schemaService.highlightedColumns = map;
  }

  public changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
  }

  public get fdClusterFilter(): ColumnCombination {
    return new ColumnCombination(this._fdClusterFilter);
  }

  public fdClusters(): Array<FdCluster> {
    const cc = this.fdClusterFilter;
    const cluster = this.table.fdClusters.filter((cluster) =>
      cc.isSubsetOf(cluster.columns)
    ).map((value, index) => [value, index] as [FdCluster, number]);
    if (cc.asArray().length > 0) {
      cluster.sort(([cluster1, index1], [cluster2, index2]) => {
        const count1 = cluster1.columns.copy().setMinus(cc).asArray().length;
        const count2 = cluster2.columns.copy().setMinus(cc).asArray().length;
        // if count is the same, use original order (stable sort)
        return count1 - count2 || index1 - index2;
      });
    }
    return cluster.map(([value,]) => value);
  }
}
