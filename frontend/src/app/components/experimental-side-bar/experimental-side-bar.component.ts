import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { DatabaseService } from 'src/app/database.service';
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import ITableHead from '@server/definitions/ITableHead';

@Component({
  selector: 'app-experimental-side-bar',
  templateUrl: './experimental-side-bar.component.html',
  styleUrls: ['./experimental-side-bar.component.css'],
})
export class ExperimentalSideBarComponent implements OnInit {
  @Input() table!: Table;
  @ViewChild(SbbTable) sbbtable?: SbbTable<ITableHead>;

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
    const violatingRows = await this.dataService.loadViolatingRowsForFD(
      this.table,
      this._lhs,
      this._rhs
    );
    this._dataSource.data = violatingRows.rows;
    this.tableColumns = violatingRows.attributes;
    this.sbbtable?.renderRows();
  }
}
