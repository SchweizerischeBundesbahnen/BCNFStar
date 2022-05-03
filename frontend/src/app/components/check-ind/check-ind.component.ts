import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, Input, ViewChild } from '@angular/core';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import ITablePage from '@server/definitions/ITablePage';
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
  @ViewChild(SbbTable) sbbtable?: SbbTable<ITablePage>;

  public pageSize: number = 20;
  public page: number = 0;
  public rowCount: number = 0;

  public referencedTable: Table | undefined;
  public relationship: Relationship = new Relationship();

  public referencingColumn: Column | undefined;
  public referencedColumn: Column | undefined;

  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];

  constructor(public dataService: DatabaseService, public dialog: SbbDialog) {}

  public addColumnRelation(): void {
    this.relationship._referencing.push(this.referencingColumn!);
    this.relationship._referenced.push(this.referencedColumn!);
  }

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

  public async checkInd(): Promise<void> {
    const dataQuery = new ViolatingINDRowsDataQuery(
      this.dataService,
      this.relationship
    );
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

  public tableSelected(): boolean {
    return this.referencedTable != undefined;
  }

  public validTables(): Array<Table> {
    return [...this.tables].filter((table) => [...table.sources].length == 1);
  }

  public canCheckIND(): boolean {
    return true;
  }

  public removeColumnRelation(): void {
    this.relationship._referenced = [];
    this.relationship._referencing = [];
    this.referencingColumn = undefined;
    this.referencedColumn = undefined;
  }

  public relationshipString(): string {
    if (this.relationship._referenced.length == 0) return '';
    return this.relationship.toString();
  }
}
