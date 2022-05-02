import Relationship from '@/src/model/schema/Relationship';
import { Component, Inject, ViewChild } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import ITablePage from '@server/definitions/ITablePage';
import { DatabaseService } from '../../database.service';

@Component({
  selector: 'app-violating-rows-view-inds',
  templateUrl: './violating-rows-view-inds.component.html',
  styleUrls: ['./violating-rows-view-inds.component.css'],
})
export class ViolatingRowsViewIndsComponent {
  public pageSize: number = 20;
  public page: number = 0;
  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];

  @ViewChild(SbbTable) sbbtable?: SbbTable<ITablePage>;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<ViolatingRowsViewIndsComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    public data: {
      relationship: Relationship;
      dataService: DatabaseService;
      rowCount: number;
    }
  ) {
    this.reloadData();
  }

  public changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
    this.reloadData();
  }

  public async reloadData() {
    const result = await this.data.dataService.loadViolatingRowsForIND(
      this.data.relationship,
      this.page * this.pageSize,
      this.pageSize
    );
    if (!result) return;
    this.tableColumns = result.attributes;
    this._dataSource.data = result.rows;
    this.sbbtable!.renderRows();
  }
}
