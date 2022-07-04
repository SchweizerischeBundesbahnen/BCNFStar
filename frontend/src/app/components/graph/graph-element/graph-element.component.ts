import BasicTable from '@/src/model/schema/BasicTable';
import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import BasicColumn from '@/src/model/types/BasicColumn';
import { Component, Input, OnInit } from '@angular/core';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-graph-element',
  templateUrl: './graph-element.component.html',
  styleUrls: ['./graph-element.component.css'],
})
export class GraphElementComponent implements OnInit {
  @Input() public table!: BasicTable;
  @Input() public bbox!: Record<string, string>;
  public showMakeDirectDimension: boolean = false;
  public isFact: boolean = false;
  public isDimension: boolean = false;
  public isDirectDimension: boolean = false;

  constructor(public schemaService: SchemaService) {}

  ngOnInit(): void {
    this.showMakeDirectDimension =
      this.table instanceof Table &&
      this.schemaService.schema.starMode &&
      this.schemaService.schema.directDimensionableRoutes(this.table, true)
        .length > 0;

    this.isFact =
      this.schemaService.starMode &&
      this.schemaService.schema.isFact(this.table, true);
    this.isDimension = this.schemaService.starMode && !this.isFact;
    this.isDirectDimension =
      this.schemaService.starMode &&
      this.schemaService.schema.isDirectDimension(this.table);
  }

  public select() {
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
}
