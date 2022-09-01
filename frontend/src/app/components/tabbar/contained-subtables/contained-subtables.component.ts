import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import Table from '@/src/model/schema/Table';
import { FdCluster } from '@/src/model/types/FdCluster';
import { Component, ViewChild } from '@angular/core';
import { SbbExpansionPanel } from '@sbb-esta/angular/accordion';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';
import { firstValueFrom } from 'rxjs';
import {
  SplitDialogResponse,
  SplitDialogComponent,
  FdSplitResponse,
  ChangeKeyResponse,
} from '../../operation-dialogs/split-dialog/split-dialog.component';

@Component({
  selector: 'app-contained-subtables',
  templateUrl: './contained-subtables.component.html',
  styleUrls: ['./contained-subtables.component.css'],
})
export class ContainedSubtablesComponent {
  @ViewChild('containedSubtablesPanel')
  containedSubtablesPanel!: SbbExpansionPanel;

  public _fdClusterFilter = new Array<Column>();
  public page: number = 0;
  public pageSize = 5;
  public fdCluster: Array<FdCluster> = [];

  public lhsSelection = new Array<Column>();

  constructor(public schemaService: SchemaService, private dialog: SbbDialog) {
    this.schemaService.selectedTableChanged.subscribe(() => {
      this._fdClusterFilter = [];
    });
  }

  public get table() {
    return this.schemaService.selectedTable as Table;
  }

  public emitHighlightedCluster(cluster: FdCluster) {
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

  /**
   * 
   * @returns fd clusters (further infos in Table.ts) eventually filterd by columns from user input
   */
  public fdClusters(): Array<FdCluster> {
    const cc = this.fdClusterFilter;
    const cluster = this.table
      .rankedFdClusters()
      .filter((cluster) => cc.isSubsetOf(cluster.columns))
      .map((value, index) => [value, index] as [FdCluster, number]);
    if (cc.asArray().length > 0) {
      cluster.sort(([cluster1, index1], [cluster2, index2]) => {
        const count1 = cluster1.columns.copy().setMinus(cc).asArray().length;
        const count2 = cluster2.columns.copy().setMinus(cc).asArray().length;
        // if count is the same, use original order (stable sort)
        return count1 - count2 || index1 - index2;
      });
    }
    return cluster.map(([value]) => value);
  }

  public fdFromLhs(): FunctionalDependency {
    const lhs = new ColumnCombination(this.lhsSelection);
    return new FunctionalDependency(lhs, this.table.hull(lhs));
  }

  public async openSplitDialog(fd: FunctionalDependency) {
    const dialogRef = this.dialog.open(SplitDialogComponent, {
      data: {
        fd: fd,
      },
      minWidth: '70%',
    });

    const response: SplitDialogResponse = await firstValueFrom(
      dialogRef.afterClosed()
    );
    if (!response) return;
    switch (response.type) {
      case 'fdSplit': {
        const fdResponse = response as FdSplitResponse;
        this.schemaService.split(fdResponse.fd, fdResponse.name);
        break;
      }
      case 'changeKey': {
        const keyResponse = response as ChangeKeyResponse;
        this._fdClusterFilter = keyResponse.rhs.asArray();
        this.containedSubtablesPanel.open();
        break;
      }
      default: {
        throw Error();
      }
    }
  }
}
