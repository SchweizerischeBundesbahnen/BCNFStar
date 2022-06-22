import BasicTable from '@/src/model/schema/BasicTable';
import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import BasicColumn from '@/src/model/types/BasicColumn';
import { Component, Input } from '@angular/core';
import Table from 'src/model/schema/Table';
import { IntegrationService } from '@/src/app/integration.service';

@Component({
  selector: 'app-graph-element',
  templateUrl: './graph-element.component.html',
  styleUrls: ['./graph-element.component.css'],
})
export class GraphElementComponent {
  @Input() public table!: BasicTable;
  @Input() public bbox!: Record<string, string>;

  constructor(
    public schemaService: SchemaService,
    public intService: IntegrationService
  ) {}

  select() {
    if (
      !this.schemaService.schema.tables.has(this.table) &&
      this.intService.isIntegrating
    ) {
      this.intService.currentlyEditedSide =
        1 - this.intService.currentlyEditedSide;
    }
    this.schemaService.selectedTable = this.table;
  }

  public isPkColumn(column: BasicColumn): boolean {
    if (!(this.table instanceof Table)) return false;
    if (this.table.implementsSurrogateKey())
      return column.name == this.table.surrogateKey;
    return (
      column instanceof Column &&
      !!this.table.pk &&
      this.table.pk.includes(column as Column)
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
      this.schemaService.schema.isDirectDimension(this.table)
    );
  }

  public isDimension(): boolean {
    return (
      this.schemaService.starMode &&
      !this.schemaService.schema.isFact(this.table, true)
    );
  }

  public get showMakeDirectDimension() {
    return (
      this.table instanceof Table &&
      this.schemaService.schema.starMode &&
      this.schemaService.schema.directDimensionableRoutes(this.table, true)
        .length > 0
    );
  }
}
