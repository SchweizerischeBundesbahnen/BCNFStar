import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { DatabaseService } from 'src/app/database.service';
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import ITablePage from '@server/definitions/ITablePage';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';

@Component({
  selector: 'app-experimental-side-bar',
  templateUrl: './experimental-side-bar.component.html',
  styleUrls: ['./experimental-side-bar.component.css'],
})
export class ExperimentalSideBarComponent implements OnInit {
  @Input() table!: Table;
  @ViewChild(SbbTable) sbbtable?: SbbTable<ITablePage>;

  public pageSize: number = 50;
  public page: number = 0;
  public rowCount: number = 0;

  public _lhs = new Array<Column>();
  public _rhs = new Array<Column>();
  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];

  constructor(public dataService: DatabaseService) {}

  ngOnInit(): void {
    console.log('init');
  }

  public checkNotAllowed(): boolean {
    return this._lhs.length == 0 || this._rhs.length == 0;
  }

  public async checkFd(): Promise<void> {
    this.rowCount = await this.dataService.loadViolatingRowsForFDCount(
      this.table,
      this._lhs,
      this._rhs
    );
    this.page = 0;
    this.reloadData();
  }

  public changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
    this.reloadData();
  }

  public async reloadData() {
    const result = await this.dataService.loadViolatingRowsForFD(
      this.table,
      this._lhs,
      this._rhs,
      this.page * this.pageSize,
      this.pageSize
    );
    if (!result) return;
    this.tableColumns = result.attributes;
    this._dataSource.data = result.rows;
    this.sbbtable!.renderRows();
  }
}
