import { Component, Inject } from '@angular/core';
import { SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import IRowCounts from '@server/definitions/IRowCounts';
import { DataQuery } from '../../../dataquery';

@Component({
  selector: 'app-violating-rows-view-inds',
  templateUrl: './violating-rows-view-inds.component.html',
  styleUrls: ['./violating-rows-view-inds.component.css'],
})
export class ViolatingRowsViewIndsComponent {
  public dataService: DataQuery;
  public rowCount: IRowCounts = { entries: 0, groups: 0 };

  constructor(
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    public data: {
      dataService: DataQuery;
      rowCount: IRowCounts;
    }
  ) {
    this.dataService = this.data.dataService;
    this.rowCount = this.data.rowCount;
  }
}
