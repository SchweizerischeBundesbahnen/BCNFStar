import { SchemaService } from '@/src/app/schema.service';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-join-dialog',
  templateUrl: './join-dialog.component.html',
  styleUrls: ['./join-dialog.component.css'],
})
export class JoinDialogComponent {
  public duplicate: boolean;
  public newTableName?: string;
  public sourceName?: string;
  public fk: TableRelationship;

  constructor(
    private schemaService: SchemaService,
    public dialogRef: SbbDialogRef<JoinDialogComponent>,
    @Inject(SBB_DIALOG_DATA) data: { fk: TableRelationship }
  ) {
    this.fk = data.fk;
    this.duplicate =
      this.schemaService.schema.referencesOf(this.fk.referenced).length > 1;
  }

  public confirm() {
    this.dialogRef.close({
      duplicate: this.duplicate,
      newTableName: this.newTableName,
      sourceName: this.sourceName,
    });
  }
}
