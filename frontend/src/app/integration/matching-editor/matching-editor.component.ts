import Table from '@/src/model/schema/Table';
import { Component } from '@angular/core';
import {
  LinkDefinition,
  PortSide,
} from '@/src/app/components/graph/schema-graph/schema-graph.component';
import { IntegrationService } from '@/src/app/integration.service';

@Component({
  selector: 'app-matching-editor',
  templateUrl: './matching-editor.component.html',
  styleUrls: ['./matching-editor.component.css'],
})
export class MatchingEditorComponent {
  public links: Array<LinkDefinition> = [];
  public tables: Array<Table> = [];

  // <newColumn, oldColumn>
  private matchings: Record<string, string[]> = {};

  constructor(private intService: IntegrationService) {
    if (!this.intService.isIntegrating)
      throw Error(
        'Trying to view matchings while not in schema integration mode'
      );
    this.intService.newSchema.tables.forEach((t) => this.tables.push(t));
    this.intService.existingSchema.tables.forEach((t) => this.tables.push(t));
    this.getMatchings();
  }
  private async getMatchings() {
    const result = await this.intService.getIniti2alMatching();
    for (const entry of result) {
      if (!this.matchings[entry.source]) this.matchings[entry.source] = [];
      this.matchings[entry.source].push(entry.target);
    }
    this.generateLinks();
  }

  private generateLinks() {
    const newLinks: Array<LinkDefinition> = [];
    for (const table of this.intService.newSchema.tables)
      for (const column of table.columns) {
        const sourceIdent = `${column.sourceColumn.table.fullName}.${column.sourceColumn.name}`;
        if (!this.matchings[sourceIdent]) continue;
        for (const target of this.matchings[sourceIdent])
          for (const existingTable of this.intService.existingSchema.tables)
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
