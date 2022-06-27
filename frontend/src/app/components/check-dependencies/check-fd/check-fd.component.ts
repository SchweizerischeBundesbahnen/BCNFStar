import Column from '@/src/model/schema/Column';
import { Component } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import { SchemaService } from '@/src/app/schema.service';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';

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
  constructor(
    public schemaService: SchemaService,
    public dialog: SbbDialog,
    private notification: SbbNotificationToast
  ) {
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

    this.isLoading = true;
    const valid = await this.schemaService.checkFd(
      this.table,
      new FunctionalDependency(
        new ColumnCombination(this.lhs),
        new ColumnCombination(this.rhs)
      )
    );
    this.isLoading = false;
    this.isValid = valid;
  }
}
