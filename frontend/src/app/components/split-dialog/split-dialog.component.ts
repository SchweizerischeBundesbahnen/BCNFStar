import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-split-dialog',
  templateUrl: './split-dialog.component.html',
  styleUrls: ['./split-dialog.component.css'],
})
export class SplitDialogComponent {
  selectedColumns = new Map<Column, Boolean>();
  columns = new Array<Column>();

  tableName: string;
  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<SplitDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA) public fd: FunctionalDependency
  ) {
    fd.rhs
      .copy()
      .setMinus(fd.lhs)
      .asSet()
      .forEach((column) => {
        this.selectedColumns.set(column, true);
        this.columns.push(column);
      });
    this.tableName = fd.lhs.columnNames().join('_').substring(0, 50);
  }

  canConfirm() {
    return [...this.selectedColumns.values()].some((bool) => bool);
  }

  confirm() {
    let new_rhs = [...this.selectedColumns]
      .filter(([, included]) => included)
      .map(([column]) => column);
    let new_fd = new FunctionalDependency(
      this.fd.lhs,
      new ColumnCombination(...new_rhs)
    );
    this.dialogRef.close({ fd: new_fd, name: this.tableName });
  }
}
