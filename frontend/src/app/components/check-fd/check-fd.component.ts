import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { DatabaseService } from 'src/app/database.service';
import { Component, Input } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { ViolatingRowsViewComponent } from '../violating-rows-view/violating-rows-view.component';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import { ViolatingFDRowsDataQuery } from '../../dataquery';

@Component({
  selector: 'app-check-fd',
  templateUrl: './check-fd.component.html',
  styleUrls: ['./check-fd.component.css'],
})
export class CustomFunctionalDependencySideBarComponent {
  @Input() table!: Table;

  public _lhs: Array<Column> = new Array<Column>();
  public _rhs: Array<Column> = new Array<Column>();

  constructor(public dataService: DatabaseService, public dialog: SbbDialog) {}

  public checkNotAllowed(): boolean {
    return this._lhs.length == 0 || this._rhs.length == 0;
  }

  public async checkFd(): Promise<void> {
    // a column always defines itself,
    this._rhs = this._rhs.filter((c) => !this._lhs.includes(c));

    const dataQuery: ViolatingFDRowsDataQuery = new ViolatingFDRowsDataQuery(
      this.dataService,
      this.table,
      this._lhs,
      this._rhs
    );
    const rowCount: number = await dataQuery.loadRowCount();

    if (rowCount == 0) {
      // valid Functional Dependency
      this.table.addFd(
        new ColumnCombination(...this._lhs),
        new ColumnCombination(...this._rhs)
      );
    } else {
      this.dialog.open(ViolatingRowsViewComponent, {
        data: {
          dataService: dataQuery,
        },
      });
    }
  }
}
