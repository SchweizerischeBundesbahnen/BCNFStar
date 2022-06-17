import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

type ColumnsList = Array<Column | null>;

enum Side {
  left,
  right,
}

@Component({
  selector: 'app-union-dialog',
  templateUrl: './union-dialog.component.html',
  styleUrls: ['./union-dialog.component.css'],
})
export class UnionDialogComponent {
  public tables: [Table, Table];
  available: [ColumnsList, ColumnsList];
  extendedAvailable: [ColumnsList, ColumnsList] = [[], []];
  matched: [ColumnsList, ColumnsList] = [[], []];

  public newTableName: string = '';

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<UnionDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    { tables }: { tables: [Table, Table] }
  ) {
    this.tables = tables;
    this.available = [
      [null, ...tables[Side.left].columns],
      [null, ...tables[Side.right].columns],
    ];
  }

  public Side = Side;

  unionPossible(): boolean {
    return (
      this.matched[0].length === this.matched[1].length &&
      this.matched[0].length != 0 &&
      this.matched[0].every(
        (el, index) => this.matched[0][index] || this.matched[1][index]
      )
    );
  }

  addColumn(column: Column | null, side: Side) {
    this.available[side] = this.available[side].filter((v) => v != column);
    this.matched[side].push(column);
    this.updateAvailable();
  }

  drop(event: CdkDragDrop<Array<any>>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.updateAvailable();
    }
  }

  updateAvailable() {
    for (const side of [Side.left, Side.right]) {
      // re-add fill with NULL to the top, and remove it anywhere else
      this.available[side] = this.available[side].filter((v) => v);
      this.available[side].unshift(null);
      // add all already matched columns to extended available except fill with null
      this.extendedAvailable[side] = [...new Set(this.matched[side])].filter(
        (v) => v
      );
    }
  }

  result() {
    return {
      columns: this.matched,
      newTableName: this.newTableName,
    };
  }
}
