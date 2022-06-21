import { SchemaService } from '@/src/app/schema.service';
import { Component } from '@angular/core';
import { SbbDialogRef } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-delete-table-dialog',
  templateUrl: './delete-table-dialog.component.html',
  styleUrls: ['./delete-table-dialog.component.css'],
})
export class DeleteTableDialogComponent {
  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<DeleteTableDialogComponent>,
    public schemaService: SchemaService
  ) {}

  public get table() {
    return this.schemaService.selectedTable!;
  }

  public confirm() {
    this.dialogRef.close({ table: this.table });
  }
}
