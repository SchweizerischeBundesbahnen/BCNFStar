import { TableRelationship } from '@/src/model/types/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-join-dialog',
  templateUrl: './join-dialog.component.html',
  styleUrls: ['./join-dialog.component.css'],
})
export class JoinDialogComponent {
  public duplicate = new Boolean(false);
  public name: string;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<JoinDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA) public fk: TableRelationship
  ) {
    this.name = 'testname';
  }

  public confirm() {
    this.dialogRef.close({ duplicate: this.duplicate, name: this.name });
  }
}
