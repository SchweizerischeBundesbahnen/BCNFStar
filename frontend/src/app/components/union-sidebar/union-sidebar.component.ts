import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, OnInit } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { SchemaService } from '../../schema.service';
import { UnionDialogComponent } from '../union-dialog/union-dialog.component';

export interface unionSpec {
  tables: Array<Table>;
  columns: Array<Array<Column | null>>;
  newTableName: string;
}

@Component({
  selector: 'app-union-sidebar',
  templateUrl: './union-sidebar.component.html',
  styleUrls: ['./union-sidebar.component.css'],
})
export class UnionSidebarComponent implements OnInit {
  public otherTable?: Table;

  constructor(public dialog: SbbDialog, public schemaService: SchemaService) {}

  ngOnInit(): void {
    return;
  }

  get table() {
    return this.schemaService.selectedTable as Table;
  }

  public filteredTables(): Array<Table> {
    return this.schemaService.schema.regularTables.filter(
      (t) => t !== this.table
    );
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UnionDialogComponent, {
      data: {
        tableLeft: this.table,
        tableRight: this.otherTable,
      }, //panelClass: "union-dialog"
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result: {
          columns: Array<Array<Column | null>>;
          newTableName: string;
        }) => {
          this.schemaService.union({
            tables: [this.table, this.otherTable!],
            columns: result.columns,
            newTableName: result.newTableName,
          });
        }
      );
  }
}
