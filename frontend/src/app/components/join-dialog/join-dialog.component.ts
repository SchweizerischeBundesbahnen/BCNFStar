import Schema from '@/src/model/schema/Schema';
import { TableRelationship } from '@/src/model/types/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-join-dialog',
  templateUrl: './join-dialog.component.html',
  styleUrls: ['./join-dialog.component.css'],
})
export class JoinDialogComponent {
  public duplicate: boolean;
  public name?: string;
  public fk: TableRelationship;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<JoinDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA) data: { fk: TableRelationship; schema: Schema }
  ) {
    this.fk = data.fk;
    this.duplicate = data.schema.numReferences(this.fk.referenced) > 1;
  }

  public confirm() {
    this.dialogRef.close({ duplicate: this.duplicate, name: this.name });
  }
}
