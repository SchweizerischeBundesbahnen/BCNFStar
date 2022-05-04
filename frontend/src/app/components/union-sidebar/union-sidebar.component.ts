import Schema from '@/src/model/schema/Schema';
import Table from '@/src/model/schema/Table';
import { Component, Input, OnInit } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { firstValueFrom } from 'rxjs';
import { UnionDialogComponent } from '../union-dialog/union-dialog.component';

@Component({
  selector: 'app-union-sidebar',
  templateUrl: './union-sidebar.component.html',
  styleUrls: ['./union-sidebar.component.css'],
})
export class UnionSidebarComponent implements OnInit {
  @Input() public table!: Table;
  @Input() public schema!: Schema;
  public otherTable?: Table;

  constructor(public dialog: SbbDialog) {}

  ngOnInit(): void {
    return;
  }

  public filteredTables(): Array<Table> {
    return [...this.schema.tables].filter((t) => t !== this.table);
  }

  async openDialog(): Promise<void> {
    const dialogRef = this.dialog.open(UnionDialogComponent, {
      data: {
        table1: this.table,
        table2: this.otherTable,
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    result;
  }
}
