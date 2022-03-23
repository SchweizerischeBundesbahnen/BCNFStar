import ColumnCombination from '@/src/model/schema/ColumnCombination';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-graph-element',
  templateUrl: './graph-element.component.html',
  styleUrls: ['./graph-element.component.css'],
})
export class GraphElementComponent {
  @Input() table!: Table;
  @Input() bbox!: Record<string, string>;
  @Input() selectedColumns?: ColumnCombination;
  @Output() selectedTable = new EventEmitter<Table>();

  constructor() {}

  select() {
    this.selectedTable.emit(this.table);
  }
}
