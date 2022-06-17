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
import { EditingMode, SchemaService } from '../../schema.service';

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

  get tables() {
    if (
      this.schemaService.mode === EditingMode.integration &&
      this.intService.existingSchema
    )
      return this.intService.tables;
    return this.schemaService.schema.tables;
  }

  constructor(
    router: Router,
    public schemaService: SchemaService,
    public intService: IntegrationService
  ) {
    if (!schemaService.hasSchema) router.navigate(['']);
    this.generateLinks();
    this.schemaService.schemaChanged.subscribe(() => this.generateLinks());
    this.intService.existingSchemaChanged.subscribe(() => this.generateLinks());
  }

  public generateLinks() {
    if (
      this.schemaService.mode === EditingMode.integration &&
      this.intService.existingSchema
    ) {
      this.links = this.intService.links;
      return;
    }
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
        });
    this.links = newLinks;
  }

  private generateJoinButton(fk: TableRelationship) {
    const generateButtonMarkup = (
      selector: string,
      circleColor: string,
      path: string
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
        tagName: 'path',
        selector: 'icon',
        attributes: {
          d: path,
          fill: 'white',
          stroke: '#FFFFFF',
          'stroke-width': 2,
          'pointer-events': 'none',
        },
      },
    ];

    const removeButton = new joint.linkTools.Button({
      markup: generateButtonMarkup(
        'delete-fk-button',
        '#ff1d00',
        'M -3 -3 3 3 M -3 3 3 -3'
      ),
      action: () => this.schemaService.dismiss(fk),
      distance: '37%',
    });
    const joinButton = new joint.linkTools.Button({
      markup: generateButtonMarkup(
        'join-button',
        '#2d327d',
        'M 0.715 2.327 L 0.715 -3.9 L 1.95 -3.9 L 1.95 2.197 A 6.396 6.396 90 0 1 1.9201 2.834 Q 1.8759 3.2721 1.768 3.627 A 3.1213 3.1213 90 0 1 1.5704 4.1249 A 2.2802 2.2802 90 0 1 1.248 4.6085 Q 0.91 4.992 0.442 5.174 A 2.6767 2.6767 90 0 1 -0.2509 5.3378 A 3.3124 3.3124 90 0 1 -0.598 5.356 Q -1.196 5.356 -1.7225 5.148 A 2.9679 2.9679 90 0 1 -2.2321 4.8906 A 2.3634 2.3634 90 0 1 -2.6 4.602 L -2.002 3.653 A 2.1918 2.1918 90 0 0 -1.4729 4.0586 A 2.5259 2.5259 90 0 0 -1.378 4.108 Q -1.014 4.29 -0.637 4.29 A 1.4196 1.4196 90 0 0 -0.1898 4.2224 A 1.1609 1.1609 90 0 0 0.351 3.848 A 1.2519 1.2519 90 0 0 0.5512 3.4892 Q 0.715 3.0524 0.715 2.327 Z'
      ),
      distance: '71%',
      action: () => this.schemaService.join(fk),
    });

    return new joint.dia.ToolsView({
      tools: [joinButton, removeButton],
    });
  }
}
