import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import Table from '@/src/model/schema/Table';
import { FdCluster } from '@/src/model/types/FdCluster';
import { Component } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';
import { firstValueFrom } from 'rxjs';
import { SplitDialogComponent } from '../../operation-dialogs/split-dialog/split-dialog.component';

@Component({
  selector: 'app-contained-subtables',
  templateUrl: './contained-subtables.component.html',
  styleUrls: ['./contained-subtables.component.css'],
})
export class ContainedSubtablesComponent {
  public _fdClusterFilter = new Array<Column>();
  public page: number = 0;
  public pageSize = 5;

  public lhsSelection = new Array<Column>();

  constructor(public schemaService: SchemaService, private dialog: SbbDialog) {
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
    return this.table.fdClusters.filter((cluster) =>
      cc.isSubsetOf(cluster.columns)
    );
  }

  public fdFromLhs(): FunctionalDependency {
    const lhs = new ColumnCombination(this.lhsSelection);
    console.log(
      this.table
        .hull(lhs)
        .asArray()
        .map((col) => this.table.columns.includes(col))
    );
    return new FunctionalDependency(lhs, this.table.hull(lhs));
  }

  public async openSplitDialog(fd: FunctionalDependency) {
    const dialogRef = this.dialog.open(SplitDialogComponent, {
      data: {
        fd: fd,
      },
    });

    const value: { fd: FunctionalDependency; name?: string } =
      await firstValueFrom(dialogRef.afterClosed());
    if (!value) return;
    this.schemaService.split(value.fd, value.name);
  }
}
