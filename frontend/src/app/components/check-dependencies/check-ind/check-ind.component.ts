import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component } from '@angular/core';
import { SbbTableDataSource } from '@sbb-esta/angular/table';
import Relationship from '@/src/model/schema/Relationship';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { ViolatingRowsViewIndsComponent } from '../../operation-dialogs/violating-rows-view-inds/violating-rows-view-inds.component';
import { ViolatingINDRowsDataQuery } from '../../../dataquery';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { SchemaService } from '@/src/app/schema.service';
import IRowCounts from '@server/definitions/IRowCounts';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';

@Component({
  selector: 'app-check-ind',
  templateUrl: './check-ind.component.html',
  styleUrls: ['./check-ind.component.css'],
})
export class CheckIndComponent {
  public get tables() {
    return Array.from(this.schemaService.schema.regularTables);
  }

  public rowCount: number = 0;
  public isLoading: boolean = false;

  public referencedTable?: Table;
  public referencingTable: Table;
  private _relationship: Relationship = new Relationship([], []);

  public referencingColumn?: Column;
  public referencedColumn?: Column;

  public _dataSource = new SbbTableDataSource<Record<string, any>>([]);
  public tableColumns: Array<string> = [];

  public isValid: boolean = false;

  constructor(
    public schemaService: SchemaService,
    private notification: SbbNotificationToast,
    public dialog: SbbDialog
  ) {
    if (!(this.schemaService.selectedTable instanceof Table))
      throw Error('Can only check inds for non-unioned tables');
    this.referencingTable = this.schemaService.selectedTable!;
    this.schemaService.selectedTableChanged.subscribe(() => {
      this.referencedTable = undefined;
      this._relationship = new Relationship([], []);

      this.referencingColumn = undefined;
      this.referencedColumn = undefined;

      this.isValid = false;
      this.isLoading = false;
      if (this.schemaService.selectedTable instanceof Table)
        this.referencingTable = this.schemaService.selectedTable!;
    });
  }

  public get relationship(): Relationship {
    this.isValid = false;
    return this._relationship;
  }

  public canAddColumnRelation(): boolean {
    if (
      this.referencingColumn == undefined ||
      this.referencedColumn == undefined
    )
      return false;
    return !(
      this._relationship.referencing.includes(this.referencingColumn!) ||
      this._relationship.referenced.includes(this.referencedColumn)
    );
  }

  public addColumnRelation(): void {
    this.relationship.add(this.referencingColumn!, this.referencedColumn!);
    this.referencedColumn = undefined;
    this.referencingColumn = undefined;
  }

  public async checkInd(): Promise<void> {
    if (this.canAddColumnRelation()) this.addColumnRelation();

    const relationShip: TableRelationship = new TableRelationship(
      this.relationship,
      this.referencingTable,
      this.referencedTable!
    );
    const dataQuery = await ViolatingINDRowsDataQuery.Create(relationShip);

    this.isLoading = true;
    const rowCount: IRowCounts | void = await dataQuery
      .loadRowCount()
      .catch((e) => {
        console.error(e);
      });
    this.isLoading = false;
    if (!rowCount) {
      this.notification.open(
        'There was a backend error while checking this IND. Check the browser and server logs for details',
        { type: 'error' }
      );
      return;
    }

    if (rowCount && rowCount.entries == 0) {
      this.isValid = true;
    } else {
      this.dialog.open(ViolatingRowsViewIndsComponent, {
        data: {
          dataService: dataQuery,
          rowCount: rowCount,
        },
      });
    }
  }

  public switchTables(): void {
    const copy: Column[] = this.relationship.referenced;
    this.relationship.referenced = this.relationship.referencing;
    this.relationship.referencing = copy;

    const copy2: Table = this.referencedTable!;
    this.referencedTable = this.referencingTable;
    this.referencingTable = copy2;
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
    return this.tables as Table[];
  }

  public canCheckIND(): boolean {
    return this.referencingColumns().length != 0 || this.canAddColumnRelation();
  }

  public removeColumnRelation(index: number): void {
    this.relationship.removeByIndex(index);
  }

  public referencingColumns(): Array<Column> {
    return this._relationship.referencing;
  }

  public referencedColumns(): Array<Column> {
    return this._relationship.referenced;
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
