import BasicTable from '@/src/model/schema/BasicTable';
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
  @Input() public table!: BasicTable;
  @Input() public schema!: Schema;
  @Input() public bbox!: Record<string, string>;
  @Input() public selectedColumns?: ColumnCombination;
  @Input() public fact!: boolean;
  @Input() public dimension!: boolean;
  @Input() selectedTable?: BasicTable;
  @Output() public selectedTableChanged = new EventEmitter<BasicTable>();
  @Output() public makeDirectDimension = new EventEmitter<Table>();

  constructor() {}

  select() {
    this.selectedTableChanged.emit(this.table);
  }

  public isPkColumn(column: BasicColumn): boolean {
    if (!(this.table instanceof Table)) return false;
    if (this.table.implementsSurrogateKey())
      return column.name == this.table.surrogateKey;
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

  public onMakeDirectDimension() {
    if (!(this.table instanceof Table)) throw Error;
    this.makeDirectDimension.emit(this.table);
  }

  public get showMakeDirectDimension() {
    return (
      this.table instanceof Table &&
      this.schema.starMode &&
      this.schema.filteredRoutesFromFactTo(this.table).length > 0
    );
  }
}
