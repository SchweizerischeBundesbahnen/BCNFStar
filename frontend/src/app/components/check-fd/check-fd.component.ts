import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { DatabaseService } from 'src/app/database.service';
import { Component, Input } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { ViolatingRowsViewComponent } from '../violating-rows-view/violating-rows-view.component';

@Component({
  selector: 'app-check-fd',
  templateUrl: './check-fd.component.html',
  styleUrls: ['./check-fd.component.css'],
})
export class ExperimentalSideBarComponent {
  @Input() table!: Table;

  public _lhs = new Array<Column>();
  public _rhs = new Array<Column>();

  constructor(public dataService: DatabaseService, public dialog: SbbDialog) {}

  public checkNotAllowed(): boolean {
    return this._lhs.length == 0 || this._rhs.length == 0;
  }

  public async checkFd(): Promise<void> {
    // a column always defines itself,
    this._rhs = this._rhs.filter((c) => !this._lhs.includes(c));

    const rowCount: number = await this.dataService.loadViolatingRowsForFDCount(
      this.table,
      this._lhs,
      this._rhs
    );

    this.dialog.open(ViolatingRowsViewComponent, {
      data: {
        table: this.table,
        dataService: this.dataService,
        _lhs: this._lhs,
        _rhs: this._rhs,
        rowCount: rowCount,
      },
    });
  }
}
