import ColumnCombination from '@/src/model/schema/ColumnCombination';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-graph-element',
  templateUrl: './graph-element.component.html',
  styleUrls: ['./graph-element.component.css'],
})
export class GraphElementComponent {
  @Input() public table!: Table;
  @Input() public bbox!: Record<string, string>;
  @Input() public selectedColumns?: ColumnCombination;
  @Input() public fact!: boolean;
  @Input() public showMakeDirectDimension!: boolean;
  @Output() public selectedTable = new EventEmitter<Table>();
  @Output() public makeDirectDimension = new EventEmitter<Table>();

  constructor() {}

  select() {
    this.selectedTable.emit(this.table);
  }
}
