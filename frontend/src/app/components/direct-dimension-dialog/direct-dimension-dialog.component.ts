import Schema from '@/src/model/schema/Schema';
import Table from '@/src/model/schema/Table';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-direct-dimension-dialog',
  templateUrl: './direct-dimension-dialog.component.html',
  styleUrls: ['./direct-dimension-dialog.component.css'],
})
export class DirectDimensionDialogComponent {
  public table: Table;
  public routes = new Map<Array<TableRelationship>, Boolean>();

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<DirectDimensionDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA) data: { table: Table; schema: Schema }
  ) {
    for (const route of data.schema.filteredRoutesFromFactTo(data.table)) {
      this.routes.set(route, false);
    }
    this.table = data.table;
  }

  public canConfirm(): boolean {
    return [...this.routes.values()].some((bool) => bool);
  }

  public confirm() {
    this.dialogRef.close({
      routes: [...this.routes.keys()].filter((route) => this.routes.get(route)),
    });
  }
}
