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

  /**
   * Currently edited column
   */
  public editingColumn?: Column;
  /**
   * The string inside the column editing field
   */
  public columnNameEditString: string = '';

  /**
   * Currently edited source
   */
  public editingSource?: SourceTableInstance;
  /**
   * The string inside the source editing field
   */
  public sourceNameEditString: string = '';

  ngOnChanges(): void {
    this.resetColumnEdit();
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

  public changeColumnName() {
    this.editingColumn!.userAlias = this.columnNameEditString || undefined;
    if (this.editingColumn!.userAlias == this.editingColumn!.sourceColumn.name)
      this.editingColumn!.userAlias = undefined;
    this.table.checkColumnNameDuplicates();
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
    this.table.checkSourceNameDuplicates();
    console.log('new alias is ', this.editingSource!.userAlias);
    this.resetSourceEdit();
  }
}
