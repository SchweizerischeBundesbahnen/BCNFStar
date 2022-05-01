import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, Input, ViewChild } from '@angular/core';
import { SbbTable, SbbTableDataSource } from '@sbb-esta/angular/table';
import ITablePage from '@server/definitions/ITablePage';
import { DatabaseService } from '@/src/app/database.service';
import Relationship from '@/src/model/schema/Relationship';

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

  constructor(public dataService: DatabaseService) {}

  public addColumnRelation(): void {
    return;
  }
  public canAddColumnRelation(): boolean {
    return true;
  }
  public tableSelected(): boolean {
    return true;
  }
  public validTables(): Array<Table> {
    return [...this.tables];
  }
}
