import Table from '@/src/model/schema/Table';
import { Component } from '@angular/core';
import {
  LinkDefinition,
  PortSide,
} from '@/src/app/components/graph/schema-graph/schema-graph.component';
import { IntegrationService } from '@/src/app/integration.service';
import { SchemaService } from '../../../schema.service';
import Schema from '@/src/model/schema/Schema';

@Component({
  selector: 'app-matching-graph',
  templateUrl: './matching-graph.component.html',
  styleUrls: ['./matching-graph.component.css'],
})
export class MatchingGraphComponent {
  public links: Array<LinkDefinition> = [];
  public tables: Array<Table> = [];

  // <newColumn, oldColumn>
  private matchings?: Record<string, string[]>;

  constructor(
    public intService: IntegrationService,
    private schemaService: SchemaService
  ) {
    this.reset();
    this.schemaService.schemaChanged.subscribe(() => this.reset());
  }

  public setSchema(schema: Schema) {
    this.intService.existingSchema = schema;
    this.reset();
  }

  private async reset() {
    this.tables = [];
    this.schemaService.schema.tables.forEach((t) => this.tables.push(t));
    this.intService.existingSchema?.tables.forEach((t) => this.tables.push(t));
    await this.generateLinks();
  }
  private async getMatchings() {
    const matchings: Record<string, string[]> = {};
    const result = await this.intService.getMatching();
    for (const entry of result) {
      if (!matchings[entry.source]) matchings[entry.source] = [];
      matchings[entry.source].push(entry.target);
    }
    return matchings;
  }

  private async generateLinks() {
    if (!this.matchings) this.matchings = await this.getMatchings();
    const newLinks: Array<LinkDefinition> = [];
    for (const table of this.schemaService.schema.tables)
      for (const column of table.columns) {
        const sourceIdent = `${column.sourceColumn.table.fullName}.${column.sourceColumn.name}`;
        if (!this.matchings[sourceIdent]) continue;
        for (const target of this.matchings[sourceIdent])
          for (const existingTable of this.intService.existingSchema!.tables)
            for (const existingColumn of existingTable.columns) {
              const sC = existingColumn.sourceColumn;
              const existingSourceIdent = `${sC.table.fullName}.${sC.name}`;
              if (target === existingSourceIdent) {
                newLinks.push({
                  source: {
                    columnName: column.sourceColumn.name,
                    side: PortSide.Right,
                    table,
                  },
                  target: {
                    columnName: existingColumn.name,
                    side: PortSide.Left,
                    table: existingTable,
                  },
                });
              }
            }
      }
    this.links = newLinks;
  }
}
