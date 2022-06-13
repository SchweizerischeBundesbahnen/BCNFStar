import Column from '@/src/model/schema/Column';
import Schema from '@/src/model/schema/Schema';
import Table from '@/src/model/schema/Table';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
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
  @Input() public table!: Table;
  @Input() public schema!: Schema;
  @Output() public union = new EventEmitter<unionSpec>();
  public otherTable?: Table;

  constructor(public dialog: SbbDialog) {}

  ngOnInit(): void {
    return;
  }

  public filteredTables(): Array<Table> {
    return this.schema.regularTables.filter((t) => t !== this.table);
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
          this.union.emit({
            tables: [this.table, this.otherTable!],
            columns: result.columns,
            newTableName: result.newTableName,
          });
        }
      );
  }
}
