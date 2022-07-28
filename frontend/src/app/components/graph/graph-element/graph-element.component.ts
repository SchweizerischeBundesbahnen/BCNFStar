import BasicTable from '@/src/model/schema/BasicTable';
import { SchemaService } from '@/src/app/schema.service';
import Column from '@/src/model/schema/Column';
import BasicColumn from '@/src/model/types/BasicColumn';
import { Component, Input, OnInit } from '@angular/core';
import Table from 'src/model/schema/Table';
import { IntegrationService } from '@/src/app/integration.service';

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
  public isDirectDimension: boolean = false;
  public isIndirectDimension: boolean = false;
  public isPotentialFact: boolean = false;

  constructor(
    public schemaService: SchemaService,
    public intService: IntegrationService
  ) {}

  ngOnInit(): void {
    if (!this.schemaService.starMode) return;
    this.showMakeDirectDimension =
      this.table instanceof Table &&
      this.schemaService.schema.directDimensionableRoutes(this.table, true)
        .length > 0;
    this.isFact = this.schemaService.schema.isFact(this.table, true);
    this.isDirectDimension =
      !this.isFact && this.schemaService.schema.isDirectDimension(this.table);
    this.isIndirectDimension = !this.isFact && !this.isDirectDimension;
    this.isPotentialFact =
      !this.isFact && this.schemaService.schema.isPotentialFact(this.table);
  }

  public select() {
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

  public isFkColumn(column: BasicColumn): boolean {
    return this.schemaService.schema.isFkColumn(this.table, column);
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
