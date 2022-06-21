import Table from '@/src/model/schema/Table';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import { SchemaService } from '../../schema.service';

@Component({
  selector: 'app-direct-dimension-dialog',
  templateUrl: './direct-dimension-dialog.component.html',
  styleUrls: ['./direct-dimension-dialog.component.css'],
})
export class DirectDimensionDialogComponent {
  public table: Table;
  public routes = new Map<Array<TableRelationship>, Boolean>();
  public allRoutes: Array<Array<TableRelationship>>;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<DirectDimensionDialogComponent>,
    schemaService: SchemaService,
    @Inject(SBB_DIALOG_DATA) data: { table: Table }
  ) {
    this.allRoutes = schemaService.schema.directDimensionableRoutes(
      data.table,
      true
    );
    for (const route of this.allRoutes) {
      this.routes.set(route, false);
    }
    this.table = data.table;
  }

  public canConfirm(): boolean {
    return [...this.routes.values()].some((bool) => bool);
  }

  public confirm() {
    this.dialogRef.close({
      routes: this.allRoutes.filter((route) => this.routes.get(route)),
    });
  }
}
