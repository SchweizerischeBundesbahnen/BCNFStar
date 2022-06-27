import { IntegrationService } from '@/src/app/integration.service';
import Column from '@/src/model/schema/Column';
import Table from '@/src/model/schema/Table';
import { Component, Input, OnInit } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { firstValueFrom } from 'rxjs';
import { SchemaService } from '../../../schema.service';
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

  @Input() availableTables!: Array<Table>;

  constructor(
    public dialog: SbbDialog,
    public schemaService: SchemaService,
    public intService: IntegrationService
  ) {}

  ngOnInit(): void {
    return;
  }

  get table() {
    return this.schemaService.selectedTable as Table;
  }

  public filteredTables(): Array<Table> {
    return this.availableTables.filter((t) => t !== this.table);
  }

  public async openDialog(): Promise<void> {
    const dialogRef = this.dialog.open(UnionDialogComponent, {
      data: {
        tables: [this.table, this.otherTable],
      },
    });

    const result: {
      columns: Array<Array<Column | null>>;
      newTableName: string;
    } = await firstValueFrom(dialogRef.afterClosed());
    this.schemaService.union({
      tables: [this.table, this.otherTable!],
      columns: result.columns,
      newTableName: result.newTableName,
    });
  }
}
