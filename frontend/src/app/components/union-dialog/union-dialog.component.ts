import Table from '@/src/model/schema/Table';
import { Component, Inject, OnInit } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-union-dialog',
  templateUrl: './union-dialog.component.html',
  styleUrls: ['./union-dialog.component.css'],
})
export class UnionDialogComponent implements OnInit {
  public table1!: Table;
  public table2!: Table;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<UnionDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA) public tables: { table1: Table; table2: Table }
  ) {
    this.table1 = tables.table1;
    this.table2 = tables.table2;
  }

  ngOnInit(): void {
    return;
  }
}
