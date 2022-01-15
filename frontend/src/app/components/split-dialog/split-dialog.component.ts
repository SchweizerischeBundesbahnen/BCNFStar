import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-split-dialog',
  templateUrl: './split-dialog.component.html',
  styleUrls: ['./split-dialog.component.css'],
})
export class SplitDialogComponent {
  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<SplitDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA) public fd: FunctionalDependency
  ) {}
}
