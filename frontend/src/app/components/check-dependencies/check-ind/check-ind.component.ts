import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, OnChanges } from '@angular/core';
import { SbbTableDataSource } from '@sbb-esta/angular/table';
import Relationship from '@/src/model/schema/Relationship';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { ViolatingRowsViewIndsComponent } from '../../operation-dialogs/violating-rows-view-inds/violating-rows-view-inds.component';
import { ViolatingINDRowsDataQuery } from '../../../dataquery';
import { SchemaService } from '@/src/app/schema.service';

@Component({
  selector: 'app-check-ind',
  templateUrl: './check-ind.component.html',
  styleUrls: ['./check-ind.component.css'],
})
export class CheckIndComponent implements OnChanges {
  public get referencingTable() {
    return this.schemaService.selectedTable!;
  }

  public get tables() {
    return Array.from(this.schemaService.schema.tables);
  }

  public rowCount: number = 0;

  public referencedTable: Table | undefined;
  public relationship: Relationship = new Relationship([], []);

  public referencingColumn: Column | undefined;
  public referencedColumn: Column | undefined;

  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];

  constructor(public schemaService: SchemaService, public dialog: SbbDialog) {}

  ngOnChanges() {
    this.referencedTable = undefined;
    this.relationship = new Relationship([], []);

    this.referencingColumn = undefined;
    this.referencedColumn = undefined;
  }

  public canAddColumnRelation(): boolean {
    if (
      this.referencingColumn == undefined ||
      this.referencedColumn == undefined
    )
      return false;
    return !(
      this.relationship.referencing.includes(this.referencingColumn!) ||
      this.relationship.referenced.includes(this.referencedColumn)
    );
  }

  public addColumnRelation(): void {
    this.relationship.add(this.referencingColumn!, this.referencedColumn!);
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
    if (
      !this.referencedTable?.sources[0].table.equals(table.sources[0].table)
    ) {
      //?
      this.relationship.referenced = [];
      this.relationship.referencing = [];
    }
  }

  public tableSelected(): boolean {
    return this.referencedTable != undefined;
  }

  public validTables(): Array<Table> {
    return [...this.tables].filter((table) => table.sources.length == 1);
  }

  public canCheckIND(): boolean {
    return this.referencingColumns().length != 0;
  }

  public removeColumnRelation(index: number): void {
    this.referencingColumns().splice(index, 1);
    this.referencedColumns().splice(index, 1);
  }

  public referencingColumns(): Array<Column> {
    return this.relationship.referencing;
  }

  public referencedColumns(): Array<Column> {
    return this.relationship.referenced;
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
