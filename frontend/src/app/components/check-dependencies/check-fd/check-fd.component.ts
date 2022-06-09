import Column from '@/src/model/schema/Column';
import { Component } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { ViolatingRowsViewComponent } from '../../operation-dialogs/violating-rows-view/violating-rows-view.component';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import { ViolatingFDRowsDataQuery } from '../../../dataquery';
import { SchemaService } from '@/src/app/schema.service';

@Component({
  selector: 'app-check-fd',
  templateUrl: './check-fd.component.html',
  styleUrls: ['./check-fd.component.css'],
})
export class CustomFunctionalDependencySideBarComponent {
  public _lhs: Array<Column> = new Array<Column>();
  public _rhs: Array<Column> = new Array<Column>();
  public isLoading: boolean = false;

  public isValid: boolean = false;
  constructor(public schemaService: SchemaService, public dialog: SbbDialog) {
    this.schemaService.selectedTableChanged.subscribe(() => {
      this.lhs = [];
      this.rhs = [];
      this.isValid = false;
      this.isLoading = false;
    });
  }

  public get table() {
    return this.schemaService.selectedTable!;
  }

  public get lhs() {
    return this._lhs;
  }

  public get rhs() {
    return this._rhs;
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
    return this.lhs.length == 0 || this.rhs.length == 0;
  }

  public async checkFd(): Promise<void> {
    // only check those columns, which are not defined by existing fds
    const rhs_copy = this.rhs.filter(
      (c) => !this.table.hull(new ColumnCombination(this.lhs)).includes(c)
    );

    const dataQuery: ViolatingFDRowsDataQuery = new ViolatingFDRowsDataQuery(
      this.table,
      this.lhs,
      rhs_copy
    );

    this.isLoading = true;
    const rowCount: number | void = await dataQuery
      .loadRowCount()
      .catch((e) => {
        console.error(e);
        this.isLoading = false;
      });
    this.isLoading = false;

    if (rowCount == 0) {
      this.isValid = true;
      this.table.addFd(
        new FunctionalDependency(
          new ColumnCombination(Array.from(this.lhs)),
          new ColumnCombination(Array.from(this.rhs))
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
