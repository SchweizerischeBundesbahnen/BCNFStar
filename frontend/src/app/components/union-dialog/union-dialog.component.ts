import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-union-dialog',
  templateUrl: './union-dialog.component.html',
  styleUrls: ['./union-dialog.component.css'],
})
export class UnionDialogComponent {
  public tableLeft!: Table;
  public tableRight!: Table;

  public tableLeftAvailable: Array<Column | null>;
  public tableLeftMatched: Array<Column | null> = [];
  public tableRightAvailable: Array<Column | null>;
  public tableRightMatched: Array<Column | null> = [];

  public newTableName: string = '';

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<UnionDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    public tables: { tableLeft: Table; tableRight: Table }
  ) {
    this.tableLeft = tables.tableLeft;
    this.tableRight = tables.tableRight;
    this.tableLeftAvailable = [null, ...this.tableLeft.columns.asArray()];
    this.tableRightAvailable = [null, ...this.tableRight.columns.asArray()];
  }

  unionPossible(): boolean {
    return (
      this.tableLeftMatched.length === this.tableRightMatched.length &&
      this.tableLeftMatched.length != 0 &&
      this.tableRightMatched.length != 0
    );
  }

  resetAvailable() {
    this.tableLeftAvailable = [null, ...this.tableLeft.columns.asArray()];
    this.tableRightAvailable = [null, ...this.tableRight.columns.asArray()];
  }

  drop(event: CdkDragDrop<Array<any>>) {
    this.resetAvailable();

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
    }
  }
}
