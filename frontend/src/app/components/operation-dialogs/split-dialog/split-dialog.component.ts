import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-split-dialog',
  templateUrl: './split-dialog.component.html',
  styleUrls: ['./split-dialog.component.css'],
})
export class SplitDialogComponent {
  public fd: FunctionalDependency;
  public pkViolation!: boolean;
  public fkViolations!: Array<TableRelationship>;
  public referenceViolations!: Array<TableRelationship>;

  public selectedColumns = new Map<Column, Boolean>();

  public tableName: string;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<SplitDialogComponent>,
    public schemaService: SchemaService,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    data: { fd: FunctionalDependency }
  ) {
    this.fd = data.fd.copy();
    this.updateViolations();
    this.fd.rhs
      .copy()
      .setMinus(this.fd.lhs)
      .asArray()
      .forEach((column) => this.selectedColumns.set(column, true));
    this.tableName = this.fd.lhs.columnNames().join('_').substring(0, 50);
  }

  public get table() {
    return this.schemaService.selectedTable!;
  }

  public setColumnSelection(column: Column, value: boolean) {
    this.selectedColumns.set(column, value);
    if (value) this.fd.rhs.add(column);
    else this.fd.rhs.delete(column);
    this.updateViolations();
  }

  public updateViolations() {
    this.pkViolation = this.schemaService.schema.fdSplitPKViolationOf(
      this.fd,
      this.table
    );
    this.fkViolations = this.schemaService.schema.fdSplitFKViolationsOf(
      this.fd,
      this.table
    );
    this.referenceViolations =
      this.schemaService.schema.fdSplitReferenceViolationsOf(
        this.fd,
        this.table
      );
  }

  public canConfirm() {
    return [...this.selectedColumns.values()].some((bool) => bool);
  }

  public confirm() {
    this.dialogRef.close({ fd: this.fd, name: this.tableName });
  }
}
