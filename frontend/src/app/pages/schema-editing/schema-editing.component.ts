import BasicTable from '@/src/model/schema/BasicTable';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as joint from 'jointjs';
import {
  LinkDefinition,
  PortSide,
  SchemaGraphComponent,
} from '../../components/graph/schema-graph/schema-graph.component';
import { IntegrationService } from '../../integration.service';
import { SchemaMergingService } from '../../schema-merging.service';
import { EditingMode, SchemaService } from '../../schema.service';

export const generateButtonMarkup = (
  selector: string,
  circleColor: string,
  text: string
) => [
  {
    tagName: 'circle',
    selector,
    attributes: {
      r: 11,
      fill: circleColor,
      cursor: 'pointer',
    },
  },
  {
    tagName: 'text',
    selector: 'label',
    textContent: text,
    attributes: {
      fill: 'white',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-weight': 'bold',
    },
  },
];

@Component({
  selector: 'app-schema-editing',
  templateUrl: './schema-editing.component.html',
  styleUrls: ['./schema-editing.component.css'],
})
export class SchemaEditingComponent {
  @ViewChild(SchemaGraphComponent, { static: true })
  public graph!: SchemaGraphComponent;

  public links: Array<LinkDefinition> = [];

  public get EditingMode() {
    return EditingMode;
  }

  public tables: Iterable<BasicTable> = [];

  constructor(
    router: Router,
    public schemaService: SchemaService,
    public intService: IntegrationService,
    public mergeService: SchemaMergingService
  ) {
    if (!schemaService.hasSchema) {
      router.navigate(['']);
    }
    this.generateGraphContent();
    this.schemaService.schemaChanged.subscribe(() =>
      this.generateGraphContent()
    );
  }

  public generateGraphContent() {
    this.tables = this.displayedTables();
    this.links = this.displayedLinks();
  }

  private displayedTables() {
    if (this.mergeService.isMerging) return this.mergeService.tables;
    if (this.intService.isComparing) return this.intService.tables;
    return this.schemaService.schema.tables;
  }

  private displayedLinks() {
    if (this.mergeService.isMerging) return this.mergeService.links;
    if (this.intService.isComparing) return this.intService.links;
    const newLinks: Array<LinkDefinition> = [];
    for (const table of this.schemaService.schema.tables)
      for (const fk of this.schemaService.schema.fksOf(table, true))
        newLinks.push({
          tool: this.generateJoinButton(fk),
          source: {
            table,
            columnName: fk.referencingName,
            side: PortSide.Right,
          },
          target: {
            table: fk.referenced,
            columnName: fk.referencedName,
            side: PortSide.Left,
          },
          arrow: true,
        });
    return newLinks;
  }

  private generateJoinButton(fk: TableRelationship) {
    const removeButton = new joint.linkTools.Button({
      markup: generateButtonMarkup('delete-fk-button', '#ff1d00', 'X'),
      action: () => this.schemaService.dismiss(fk),
      distance: '37%',
    });
    const joinButton = new joint.linkTools.Button({
      markup: generateButtonMarkup('join-button', '#2d327d', 'J'),
      distance: '71%',
      action: () => this.schemaService.join(fk),
    });

    return new joint.dia.ToolsView({
      tools: [joinButton, removeButton],
    });
  }
}
