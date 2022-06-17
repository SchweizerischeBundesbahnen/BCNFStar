import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import SourceTableInstance from '@/src/model/schema/SourceTableInstance';
import Table from '@/src/model/schema/Table';
import { Component } from '@angular/core';
@Component({
  selector: 'app-table-editing',
  templateUrl: './table-editing.component.html',
  styleUrls: ['./table-editing.component.css'],
})
export class TableEditingComponent {
  /** Is the table name being edited? */
  public isEditingTableName = false;
  /** The string inside the schema editing field */
  public tableNameEditString: string = '';

  /** Currently edited column */
  public editingColumn?: Column;
  /** The string inside the column editing field */
  public columnNameEditString: string = '';

  /** Currently edited source */
  public editingSource?: SourceTableInstance;
  /** The string inside the source editing field */
  public sourceNameEditString: string = '';

  constructor(public schemaService: SchemaService) {
    this.schemaService.selectedTableChanged.subscribe(() => {
      this.resetTableEdit();
      this.resetColumnEdit();
      this.resetSourceEdit();
    });
  }

  public get table() {
    return this.schemaService.selectedTable as Table;
  }

  // TABLENAME EDITING

  public resetTableEdit() {
    this.isEditingTableName = false;
  }

  public startTableEdit() {
    this.isEditingTableName = true;
    this.tableNameEditString = this.table.name;
  }

  public changeTableName() {
    this.table.name = this.tableNameEditString;
    this.resetTableEdit();
  }

  // COLUMN EDITING

  public resetColumnEdit() {
    this.editingColumn = undefined;
    this.columnNameEditString = '';
  }

  public startColumnEdit(column: Column) {
    this.editingColumn = column;
    this.columnNameEditString = column.baseAlias;
  }

  public deleteColumn(column: Column): void {
    this.schemaService.deleteColumn(column);
  }

  public changeColumnName() {
    this.editingColumn!.userAlias = this.columnNameEditString || undefined;
    if (this.editingColumn!.userAlias == this.editingColumn!.sourceColumn.name)
      this.editingColumn!.userAlias = undefined;
    this.table.resolveColumnNameDuplicates();
    this.resetColumnEdit();
  }

  // SOURCE EDITING

  public resetSourceEdit() {
    this.editingSource = undefined;
    this.sourceNameEditString = '';
  }

  public startSourceEdit(source: SourceTableInstance) {
    this.editingSource = source;
    this.sourceNameEditString = source.baseAlias;
  }

  public changeSourceName() {
    this.editingSource!.setUserAlias(this.sourceNameEditString);
    this.table.resolveSourceNameDuplicates();
    this.resetSourceEdit();
  }
}
