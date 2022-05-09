import Schema from '@/src/model/schema/Schema';
import Table from '@/src/model/schema/Table';
import { TableRelationship } from '@/src/model/types/TableRelationship';
import { Component, Inject, ViewChild } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import { SbbRadioGroup } from '@sbb-esta/angular/radio-button';

@Component({
  selector: 'app-direct-dimension-dialog',
  templateUrl: './direct-dimension-dialog.component.html',
  styleUrls: ['./direct-dimension-dialog.component.css'],
})
export class DirectDimensionDialogComponent {
  public table: Table;
  public routes: Array<Array<TableRelationship>>;

  @ViewChild('routeSelection', { read: SbbRadioGroup })
  private routeSelectionGroup!: SbbRadioGroup;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<DirectDimensionDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA) data: { table: Table; schema: Schema }
  ) {
    this.routes = data.schema.filteredRoutesFromFactTo(data.table);
    this.table = data.table;
  }

  public canConfirm(): boolean {
    return this.routeSelectionGroup?.value;
  }

  public confirm() {
    this.dialogRef.close({
      route: this.routeSelectionGroup.value,
    });
  }
}
