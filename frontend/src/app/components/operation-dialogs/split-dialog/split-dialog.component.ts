import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
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

  public minimalDeterminants!: Array<ColumnCombination>;
  public hull!: ColumnCombination;

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
    this.table.columns.asArray().forEach((column) => {
      this.selectedColumns.set(column, false);
    });
    this.hull = this.table.hull(this.fd.lhs);
    this.table.columns.asArray().forEach((column) => {
      if (this.fd.rhs.includes(column)) this.selectedColumns.set(column, true);
    });
    this.tableName = this.fd.lhs.columnNames().join('_').substring(0, 50);
    this.updateViolations();
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

  public selectedColumnsCC() {
    return new ColumnCombination(
      this.table.columns
        .asArray()
        .filter((column) => this.selectedColumns.get(column))
    );
  }

  public changeLhs() {
    console.log(this.minimalDeterminants);
    console.log(
      this.minimalDeterminants.filter((cc) => this.fd.lhs.isSubsetOf(cc))
    );
  }

  public isKeyNonMinimal() {
    return !this.minimalDeterminants.some((det) => det.equals(this.fd.lhs));
  }

  public updateViolations() {
    this.minimalDeterminants = this.table.minimalDeterminantsOf(
      this.selectedColumnsCC()
    );
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
