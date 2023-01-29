import { NewValueDataQuery } from '@/src/app/dataquery';
import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import Table from '@/src/model/schema/Table';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { Component, Inject } from '@angular/core';
import { SbbDialogRef, SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';

export interface SplitDialogResponse {
  type: string;
}

export interface FdSplitResponse extends SplitDialogResponse {
  fd: FunctionalDependency;
  name: string;
  nullSubstitutes: Map<Column, string>;
}

export interface ChangeKeyResponse extends SplitDialogResponse {
  rhs: ColumnCombination;
}

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

  public selectedColumns = new Map<Column, boolean>();

  public tableName: string;

  public nullCols!: Array<Column>;
  public nullSubstitutes!: Map<Column, string>;
  public nullSubstituteErrors!: Map<Column, string>;
  public nullSubstituteCheckValid: boolean = false;

  constructor(
    // eslint-disable-next-line no-unused-vars
    public dialogRef: SbbDialogRef<
      SplitDialogComponent,
      FdSplitResponse | ChangeKeyResponse
    >,
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
    this.fd.rhs.asArray().forEach((column) => {
      this.selectedColumns.set(column, true);
    });
    this.tableName = this.fd.lhs.columnNames().join('_').substring(0, 50);
    this.updateViolations();
    this.initNullSubstitutes();
  }

  public get table() {
    return this.schemaService.selectedTable as Table;
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
  }

  public initNullSubstitutes() {
    this.nullCols = new Array<Column>();
    this.nullSubstitutes = new Map<Column, string>();
    this.nullSubstituteErrors = new Map<Column, string>();

    for (let column of this.fd.lhs) {
      if (column.sourceColumn.safeInferredNullable) {
        this.nullCols.push(column);
        this.nullSubstitutes.set(column, column.nullSubstitute ?? '');
      }
    }
    this.checkNullSubstitutes();
  }

  public async checkNullSubstitutes() {
    for (let column of this.nullCols) {
      this.nullSubstituteErrors.set(column, '');
      if (!this.nullSubstitutes.get(column)) {
        this.nullSubstituteErrors.set(column, 'No substitute specified.');
        continue;
      }
      const dataQuery: NewValueDataQuery = await NewValueDataQuery.Create(
        column.sourceColumn,
        this.nullSubstitutes.get(column)!
      );
      if (!(await dataQuery.result())) {
        this.nullSubstituteErrors.set(column, 'substitute exists in data.');
      }
    }
    this.nullSubstituteCheckValid = true;
  }

  public isFullyDetermined() {
    return this.selectedColumnsCC().isSubsetOf(this.hull);
  }

  public canConfirm() {
    return (
      [...this.selectedColumns.values()].some((bool) => bool) &&
      this.isFullyDetermined() &&
      this.nullSubstituteCheckValid &&
      [...this.nullSubstituteErrors.values()].every((error) => !error)
    );
  }

  public confirm() {
    this.dialogRef.close({
      type: 'fdSplit',
      fd: this.fd,
      name: this.tableName,
      nullSubstitutes: this.nullSubstitutes,
    });
  }

  public showViolations() {
    this.schemaService.checkFd(this.table, this.fd);
  }

  public otherKey() {
    this.dialogRef.close({ type: 'changeKey', rhs: this.fd.rhs });
  }
}
