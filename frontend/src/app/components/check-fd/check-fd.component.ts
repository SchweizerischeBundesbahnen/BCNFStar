import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { DatabaseService } from 'src/app/database.service';
import { Component, Input, OnChanges } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { ViolatingRowsViewComponent } from '../violating-rows-view/violating-rows-view.component';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import { ViolatingFDRowsDataQuery } from '../../dataquery';

@Component({
  selector: 'app-check-fd',
  templateUrl: './check-fd.component.html',
  styleUrls: ['./check-fd.component.css'],
})
export class CustomFunctionalDependencySideBarComponent implements OnChanges {
  @Input() table!: Table;

  public _lhs: Array<Column> = new Array<Column>();
  public _rhs: Array<Column> = new Array<Column>();
  public isLoading: boolean = false;

  public isValid: boolean = false;
  constructor(public dataService: DatabaseService, public dialog: SbbDialog) {}

  ngOnChanges(): void {
    this.lhs = [];
    this.rhs = [];
  }

  public set lhs(columns: Array<Column>) {
    this.isValid = false;
    this._lhs = columns;
  }

  public set rhs(columns: Array<Column>) {
    this.isValid = false;
    this._rhs = columns;
  }

  public checkNotAllowed(): boolean {
    return this._lhs.length == 0 || this._rhs.length == 0;
  }

  public async checkFd(): Promise<void> {
    // a column always defines itself,
    this.rhs = this._rhs.filter((c) => !this._lhs.includes(c));

    const dataQuery: ViolatingFDRowsDataQuery = new ViolatingFDRowsDataQuery(
      this.table,
      this._lhs,
      this._rhs
    );

    this.isLoading = true;
    const rowCount: number = await dataQuery.loadRowCount();
    this.isLoading = false;

    if (rowCount == 0) {
      this.isValid = true;
      this.table.addFd(
        new FunctionalDependency(
          new ColumnCombination(this._lhs),
          new ColumnCombination(this._rhs)
        )
      );
    } else {
      this.dialog.open(ViolatingRowsViewComponent, {
        data: {
          dataService: dataQuery,
          rowCount: rowCount,
        },
      });
    }
  }
}
