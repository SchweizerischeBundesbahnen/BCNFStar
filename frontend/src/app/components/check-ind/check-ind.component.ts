import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, Input } from '@angular/core';
import { SbbTableDataSource } from '@sbb-esta/angular/table';
import { DatabaseService } from '@/src/app/database.service';
import Relationship from '@/src/model/schema/Relationship';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { ViolatingRowsViewIndsComponent } from '../violating-rows-view-inds/violating-rows-view-inds.component';
import { ViolatingINDRowsDataQuery } from '../../dataquery';

@Component({
  selector: 'app-check-ind',
  templateUrl: './check-ind.component.html',
  styleUrls: ['./check-ind.component.css'],
})
export class CheckIndComponent {
  @Input() referencingTable!: Table;
  @Input() tables!: Set<Table>;

  public rowCount: number = 0;

  public referencedTable: Table | undefined;
  public relationship: Relationship = new Relationship();

  public referencingColumn: Column | undefined;
  public referencedColumn: Column | undefined;

  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];

  constructor(public dataService: DatabaseService, public dialog: SbbDialog) {}

  public canAddColumnRelation(): boolean {
    if (
      this.referencingColumn == undefined ||
      this.referencedColumn == undefined
    )
      return false;
    return !(
      this.relationship._referencing.includes(this.referencingColumn!) ||
      this.relationship._referenced.includes(this.referencedColumn)
    );
  }

  public addColumnRelation(): void {
    this.referencedColumns().push(this.referencedColumn!);
    this.referencingColumns().push(this.referencingColumn!);

    this.referencedColumn = undefined;
    this.referencingColumn = undefined;
  }

  public async checkInd(): Promise<void> {
    const dataQuery = new ViolatingINDRowsDataQuery(this.relationship);
    const rowCount: number = await dataQuery.loadRowCount();

    if (rowCount == 0) {
      // valid Inclusion Dependency
    } else {
      this.dialog.open(ViolatingRowsViewIndsComponent, {
        data: {
          dataService: dataQuery,
        },
      });
    }
  }

  public onTableSelected(table: Table) {
    if (table.schemaAndName() != this.referencedTable?.schemaAndName()) {
      this.relationship._referenced = [];
      this.relationship._referencing = [];
    }
  }

  public tableSelected(): boolean {
    return this.referencedTable != undefined;
  }

  public validTables(): Array<Table> {
    return [...this.tables].filter((table) => [...table.sources].length == 1);
  }

  public canCheckIND(): boolean {
    return this.referencingColumns().length != 0;
  }

  public removeColumnRelation(index: number): void {
    this.referencingColumns().splice(index, 1);
    this.referencedColumns().splice(index, 1);
  }

  public referencingColumns(): Array<Column> {
    return this.relationship._referencing;
  }

  public referencedColumns(): Array<Column> {
    return this.relationship._referenced;
  }

  public validReferencingColumns(): Array<Column> {
    return this.referencingTable.columns
      .asArray()
      .filter((c) => !this.referencingColumns().includes(c));
  }

  public validReferencedColumns(): Array<Column> {
    return this.referencedTable!.columns.asArray().filter(
      (c) => !this.referencedColumns().includes(c)
    );
  }
}
