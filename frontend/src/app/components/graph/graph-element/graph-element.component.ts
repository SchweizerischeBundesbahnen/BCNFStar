import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import BasicColumn from '@/src/model/types/BasicColumn';
import { Component, Input } from '@angular/core';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-graph-element',
  templateUrl: './graph-element.component.html',
  styleUrls: ['./graph-element.component.css'],
})
export class GraphElementComponent {
  @Input() public table!: Table;
  @Input() public bbox!: Record<string, string>;

  constructor(public schemaService: SchemaService) {}

  select() {
    this.schemaService.selectedTable = this.table;
  }

  public isPkColumn(column: BasicColumn): boolean {
    if (this.table.implementsSurrogateKey())
      return column.name == this.table.surrogateKey;
    return (
      column instanceof Column &&
      !!this.table.pk &&
      this.table.pk.includes(column as Column)
    );
  }

  public isFkColumn(column: BasicColumn): boolean {
    return this.schemaService.schema.isFkColumn(this.table, column);
  }

  public isFactColumn(column: BasicColumn) {
    if (!this.isFact()) return false;
    return (
      !this.isFkColumn(column) &&
      !(
        this.table.implementsSurrogateKey() &&
        column.name == this.table.surrogateKey
      ) &&
      !this.table.pk?.includes(column as Column)
    );
  }

  public isHighlightedColumn(column: BasicColumn): boolean {
    if (!(column instanceof Column) || !this.schemaService.highlightedColumns)
      return false;
    const highlightedCols = this.schemaService.highlightedColumns.get(
      this.table
    );
    if (!highlightedCols) return false;
    return highlightedCols.includes(column);
  }

  public isFact(): boolean {
    return (
      this.schemaService.starMode &&
      this.schemaService.schema.isFact(this.table, true)
    );
  }

  public isDirectDimension(): boolean {
    return (
      this.schemaService.starMode &&
      !this.schemaService.schema.isFact(this.table, true) &&
      this.schemaService.schema.isDirectDimension(this.table)
    );
  }

  public isDimension(): boolean {
    return (
      this.schemaService.starMode &&
      !this.schemaService.schema.isFact(this.table, true) &&
      !this.schemaService.schema.isDirectDimension(this.table)
    );
  }

  public isPotentialFact(): boolean {
    return (
      this.schemaService.starMode &&
      !this.schemaService.schema.isFact(this.table, true) &&
      this.schemaService.schema.isPotentialFact(this.table)
    );
  }

  public showMakeDirectDimension(): boolean {
    return (
      this.schemaService.starMode &&
      this.schemaService.schema.directDimensionableRoutes(this.table, true)
        .length > 0
    );
  }
}
