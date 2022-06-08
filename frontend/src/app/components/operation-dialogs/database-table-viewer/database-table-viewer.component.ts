import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import ITablePage from '@server/definitions/ITablePage';
import { DataQuery } from '../../../dataquery';

@Component({
  selector: 'app-database-table-viewer',
  templateUrl: './database-table-viewer.component.html',
  styleUrls: ['./database-table-viewer.component.css'],
})
export class DatabaseTableViewerComponent implements OnInit {
  public pageSize: number = 20;
  public page: number = 0;
  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];
  public isLoading = false;

  @ViewChild(SbbTable) sbbtable?: SbbTable<ITablePage>;

  @Input() dataService!: DataQuery;
  @Input() rowCount!: number;

  constructor() {}

  public async ngOnInit(): Promise<void> {
    this.reloadData();
  }

  public changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
    this.reloadData();
  }

  public isGroup(_index: number, item: { isGroupBy: boolean }): boolean {
    return item.isGroupBy;
  }

  public async reloadData() {
    this.isLoading = true;
    const result = await this.dataService
      .loadTablePage(this.page * this.pageSize, this.pageSize)
      .catch((e) => {
        console.error(`Could not reload data`);
        console.error(e);
      });
    this.isLoading = false;

    if (!result) return;
    this.tableColumns = result.attributes;
    this._dataSource.data = result.rows;
    this.sbbtable!.renderRows();
  }
}
