import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, Input, OnChanges } from '@angular/core';
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
export class CheckIndComponent implements OnChanges {
  @Input() referencingTable!: Table;
  @Input() tables!: Set<Table>;

  public rowCount: number = 0;
  public isLoading: boolean = false;

  public referencedTable: Table | undefined;
  public relationship: Relationship = new Relationship([], []);

  public referencingColumn: Column | undefined;
  public referencedColumn: Column | undefined;

  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];

  constructor(public dataService: DatabaseService, public dialog: SbbDialog) {}

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

    this.isLoading = true;
    const rowCount: number = await dataQuery.loadRowCount();
    this.isLoading = false;

    if (rowCount == 0) {
      // valid Inclusion Dependency
    } else {
      this.dialog.open(ViolatingRowsViewIndsComponent, {
        data: {
          dataService: dataQuery,
          rowCount: rowCount,
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
