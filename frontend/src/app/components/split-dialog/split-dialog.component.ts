import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import Schema from '@/src/model/schema/Schema';
import Table from '@/src/model/schema/Table';
import { TableRelationship } from '@/src/model/types/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

@Component({
  selector: 'app-split-dialog',
  templateUrl: './split-dialog.component.html',
  styleUrls: ['./split-dialog.component.css'],
})
export class SplitDialogComponent {
  public fd: FunctionalDependency;
  public table: Table;
  public schema: Schema;
  public fkViolations!: Array<TableRelationship>;
  public referenceViolations!: Array<TableRelationship>;

  public selectedColumns = new Map<Column, Boolean>();

  public tableName: string;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<SplitDialogComponent>,
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    data: { fd: FunctionalDependency; table: Table; schema: Schema }
  ) {
    this.fd = new FunctionalDependency(data.fd.lhs.copy(), data.fd.rhs.copy());
    this.table = data.table;
    this.schema = data.schema;
    this.updateViolations();
    this.fd.rhs
      .copy()
      .setMinus(this.fd.lhs)
      .asArray()
      .forEach((column) => this.selectedColumns.set(column, true));
    this.tableName = this.fd.lhs.columnNames().join('_').substring(0, 50);
  }

  public setColumnSelection(column: Column, value: boolean) {
    this.selectedColumns.set(column, value);
    if (value) this.fd.rhs.add(column);
    else this.fd.rhs.delete(column);
    this.updateViolations();
  }

  public updateViolations() {
    this.fkViolations = this.schema.fdSplitFKViolationsOf(this.fd, this.table);
    this.referenceViolations = this.schema.fdSplitReferenceViolationsOf(
      this.fd,
      this.table
    );
  }

  public toString(rel: TableRelationship): string {
    return `(${rel.referencing.name}) ${new ColumnCombination(
      rel.relationship.referencing
    ).toString()} -> (${rel.referenced.name}) ${new ColumnCombination(
      rel.relationship.referenced
    ).toString()}`;
  }

  public canConfirm() {
    return [...this.selectedColumns.values()].some((bool) => bool);
  }

  public confirm() {
    this.dialogRef.close({ fd: this.fd, name: this.tableName });
  }
}
