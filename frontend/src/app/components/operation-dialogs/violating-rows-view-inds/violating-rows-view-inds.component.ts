import { Component, Inject, OnInit } from '@angular/core';
import { SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import { DataQuery } from '../../../dataquery';

@Component({
  selector: 'app-violating-rows-view-inds',
  templateUrl: './violating-rows-view-inds.component.html',
  styleUrls: ['./violating-rows-view-inds.component.css'],
})
export class ViolatingRowsViewIndsComponent implements OnInit {
  public dataService: DataQuery;
  public rowCount: number = 0;

  constructor(
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    public data: {
      dataService: DataQuery;
    }
  ) {
    this.dataService = this.data.dataService;
  }

  async ngOnInit(): Promise<void> {
    this.rowCount = await this.dataService.loadRowCount();
  }
}
