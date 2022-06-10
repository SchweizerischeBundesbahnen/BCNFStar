import Table from '@/src/model/schema/Table';
import { Component } from '@angular/core';
import {
  LinkDefinition,
  PortSide,
} from '@/src/app/components/graph/schema-graph/schema-graph.component';
import { IntegrationService } from '@/src/app/integration.service';
import Column from '@/src/model/schema/Column';

interface TableColumn {
  table: Table;
  column: Column;
}

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
  private toTableColumn: Record<string, TableColumn> = {};

  constructor(private intService: IntegrationService) {
    if (!this.intService.isIntegrating)
      throw Error(
        'Trying to view matchings while not in schema integrating mode'
      );

    this.intService.newSchema.tables.forEach((t) => this.tables.push(t));
    this.intService.existingSchema.tables.forEach((t) => this.tables.push(t));
    this.getMatchings();
  }
  private async getMatchings() {
    const result = await this.intService.getIniti2alMatching();
    console.log(result);
    for (const table of this.intService.existingSchema.tables) {
      for (const column of table.columns) {
        const identifier = `${table.fullName}.${column.name}`;
        this.toTableColumn[identifier] = { table, column };
      }
    }
    for (const table of this.intService.newSchema.tables) {
      for (const column of table.columns) {
        const identifier = `${table.fullName}.${column.name}`;
        this.toTableColumn[identifier] = { table, column };
        this.matchings[identifier] = result
          .filter((entry) => entry.source === identifier)
          .map((entry) => entry.target);
      }
    }
    this.generateLinks();
  }

  private generateLinks() {
    const newLinks: Array<LinkDefinition> = [];
    for (const source in this.matchings) {
      const tCSource = this.toTableColumn[source];
      if (!tCSource) continue;
      for (const target of this.matchings[source]) {
        const tCTarget = this.toTableColumn[target];
        if (!tCTarget) continue;
        newLinks.push({
          source: {
            columnName: tCSource.column.name,
            side: PortSide.Left,
            table: tCSource.table,
          },
          target: {
            columnName: tCTarget.column.name,
            side: PortSide.Left,
            table: tCTarget.table,
          },
        });
      }
    }
    this.links = newLinks;
    console.log(this.links);
  }
}
