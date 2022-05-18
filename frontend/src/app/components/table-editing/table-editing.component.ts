import Column from '@/src/model/schema/Column';
import SourceTableInstance from '@/src/model/schema/SourceTableInstance';
import { Component, Input, OnChanges } from '@angular/core';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-table-editing',
  templateUrl: './table-editing.component.html',
  styleUrls: ['./table-editing.component.css'],
})
export class TableEditingComponent implements OnChanges {
  @Input() public table!: Table;

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

  ngOnChanges(): void {
    this.resetTableEdit();
    this.resetColumnEdit();
    this.resetSourceEdit();
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
    throw Error(column.toString());
  }

  public changeColumnName() {
    this.editingColumn!.userAlias = this.columnNameEditString || undefined;
    if (this.editingColumn!.userAlias == this.editingColumn!.sourceColumn.name)
      this.editingColumn!.userAlias = undefined;
    this.table.resolveColumnNameDuplicates();
    console.log('new alias is ', this.editingColumn!.userAlias);
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
    console.log('new alias is ', this.editingSource!.userAlias);
    this.resetSourceEdit();
  }
}
