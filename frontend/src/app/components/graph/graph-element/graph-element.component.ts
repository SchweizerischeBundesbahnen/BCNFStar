import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import Schema from '@/src/model/schema/Schema';
import BasicColumn from '@/src/model/types/BasicColumn';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-graph-element',
  templateUrl: './graph-element.component.html',
  styleUrls: ['./graph-element.component.css'],
})
export class GraphElementComponent {
  @Input() public table!: Table;
  @Input() public schema!: Schema;
  @Input() public bbox!: Record<string, string>;
  @Input() public selectedColumns?: ColumnCombination;
  @Input() public fact!: boolean;
  @Input() public dimension!: boolean;
  @Input() public showMakeDirectDimension!: boolean;
  @Input() selectedTable?: Table;
  @Output() public selectedTableChanged = new EventEmitter<Table>();
  @Output() public makeDirectDimension = new EventEmitter<Table>();

  constructor() {}

  select() {
    this.selectedTableChanged.emit(this.table);
  }

  public isPkColumn(column: BasicColumn): boolean {
    return (
      column instanceof Column &&
      !!this.table.pk &&
      this.table.pk!.includes(column as Column)
    );
  }

  public isHighlightedColumn(column: BasicColumn): boolean {
    return (
      column instanceof Column &&
      !!this.selectedColumns &&
      this.selectedColumns.includes(column as Column)
    );
  }
}
