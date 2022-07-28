import { Component, AfterContentInit, Input, OnChanges } from '@angular/core';
import * as joint from 'jointjs';
import Table from 'src/model/schema/Table';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
import panzoom, { PanZoom, Transform } from 'panzoom';
import { SchemaService } from '@/src/app/schema.service';
import BasicTable from '@/src/model/schema/BasicTable';
import { IntegrationService } from '@/src/app/integration.service';
import { SchemaMergingService } from '@/src/app/schema-merging.service';

type GraphStorageItem = {
  jointjsEl: joint.dia.Element;
  style: Record<string, any>;
  links: Map<Table, joint.dia.Link>;
};

export enum PortSide {
  Left,
  Right,
}

export interface LinkEndDefinititon {
  table: BasicTable;
  columnName: string;
  side: PortSide;
}
export interface LinkDefinition {
  source: LinkEndDefinititon;
  target: LinkEndDefinititon;
  tool?: joint.dia.ToolsView;
  arrow?: boolean;
}

@Component({
  selector: 'app-schema-graph',
  templateUrl: './schema-graph.component.html',
  styleUrls: ['./schema-graph.component.css'],
})
export class SchemaGraphComponent implements AfterContentInit, OnChanges {
  @Input() public tables: Iterable<BasicTable> = [];
  @Input() public links: Iterable<LinkDefinition> = [];
  protected panzoomTransform: Transform = { x: 0, y: 0, scale: 1 };

  protected columnHeight = 23;

  public graphStorage = new Map<BasicTable, GraphStorageItem>();

  protected graph!: joint.dia.Graph;
  protected paper!: joint.dia.Paper;

  protected elementWidth = 300;

  constructor(
    private schemaService: SchemaService,
    private intService: IntegrationService,
    private mergeService: SchemaMergingService
  ) {}

  ngOnChanges() {
    this.updateGraph();
  }

  ngAfterContentInit(): void {
    this.graph = new joint.dia.Graph();
    this.paper = new joint.dia.Paper({
      el: document.getElementById('paper') || undefined,
      model: this.graph,
      height: null,
      width: null,
      background: {
        color: 'rgba(200, 200, 200, 0.3)',
      },
    });

    this.paper.on('blank:pointerclick', () => {
      this.schemaService.selectedTable = undefined;
    });

    // move the corresponding HTML overlay whenever a graph element changes position
    this.graph.on('change:position', (element) => {
      if (element.isElement)
        for (const item of this.graphStorage.values()) {
          if (item.jointjsEl == element) {
            this.updateBBox(item);
          }
        }
    });

    this.addPanzoomHandler();
    this.schemaService.selectedTableChanged.subscribe(() => {
      this.centerOnSelectedTable();
    });
    this.updateGraph();
  }

  public updateGraph() {
    if (!this.paper) return;
    this.graph.clear();
    this.graphStorage = new Map<Table, GraphStorageItem>();
    this.generateElements();
    this.generateLinks();
    joint.layout.DirectedGraph.layout(this.graph, {
      dagre,
      graphlib,
      nodeSep: 40,
      // prevent left ports from being cut off
      marginX: this.columnHeight / 2,
      rankSep:
        this.intService.isComparing || this.mergeService.isMerging ? 200 : 100,
      rankDir: 'LR',
    });

    setTimeout(() => {
      this.updateAllBBoxes();
    }, 10);

    this.centerOnSelectedTable();
  }

  protected panzoomHandler?: PanZoom;
  // We use the panzoom library becuase pan and zoom detection is difficult and must
  // feel intuitive on a range of devices. We just take the transform and override the
  // default panzoom conotroller to move both the graph elements and the associated Angular
  // components
  private addPanzoomHandler() {
    this.panzoomHandler = panzoom(
      document.querySelector('#paper svg g') as SVGElement,
      {
        smoothScroll: false,
        controller: {
          getOwner() {
            return document.querySelector('#paper svg') as HTMLElement;
          },
          applyTransform: (transform) => {
            this.panzoomTransform = Object.assign({}, transform);
            this.paper.scale(transform.scale);
            this.paper.translate(transform.x, transform.y);

            this.updateAllBBoxes();
          },
        },
        // disable panzoom when clicking on a jointjs element,
        // so that dragging single elements still works
        // (false means: enable panzoom, true disable panzoom)
        beforeMouseDown: (evt: MouseEvent) => {
          if (!evt.target) return false;
          let element: HTMLElement | null = evt.target as HTMLElement;
          while (element !== null) {
            if (element.id.startsWith('__jointel')) return true;
            element = element.parentElement;
          }
          return false;
        },
      }
    );
  }

  private generateElements() {
    for (const table of this.tables) {
      const jointjsEl = new joint.shapes.standard.Rectangle({
        attrs: { root: { id: '__jointel__' + table.fullName } },
      });
      jointjsEl.attr({
        body: {
          strokeWidth: 0,
        },
        '.': { magnet: false },
      });
      jointjsEl.resize(
        this.elementWidth,
        60 +
          this.columnHeight *
            this.schemaService.schema.displayedColumnsOf(table).length
      );
      this.graphStorage.set(table, {
        // alternative to HtmlElement: joint.shapes.html.Element
        jointjsEl,
        style: {},
        links: new Map(),
      });
      this.generatePorts(jointjsEl, table);
      this.graph.addCell(jointjsEl);
    }
  }

  private generateLinks() {
    const toLinkEnd = (def: LinkEndDefinititon) => {
      return {
        id: this.graphStorage.get(def.table)?.jointjsEl.id,
        port: def.columnName + (def.side == PortSide.Left ? '_left' : '_right'),
      };
    };
    for (const linkDef of this.links) {
      let link = new joint.shapes.standard.Link({
        source: toLinkEnd(linkDef.source),
        target: toLinkEnd(linkDef.target),
        z: -1,
      });
      // reversed arrowhead to align with powerbi
      link.attr({
        line: {
          sourceMarker: linkDef.arrow
            ? {
                type: 'path',
                d: 'M 10 -5 0 0 10 5 Z',
              }
            : { type: 'none' },
          targetMarker: {
            type: 'none',
          },
        },
      });
      this.graph.addCell(link);
      if (linkDef.tool) {
        var linkView = link.findView(this.paper!);
        linkView.addTools(linkDef.tool);
      }
    }
  }

  // if you change this, also change graph-element.component.css > .table-head > height
  protected graphElementHeaderHeight: number = 25;
  private generatePortMarkup(
    counter: number,
    side: PortSide,
    table: BasicTable
  ) {
    const cx = side == PortSide.Left ? 0 : this.elementWidth;
    let fill = 'white';
    if (this.intService.isInRightSchema(table)) fill = 'rgb(250, 255, 245)';
    else if (this.intService.isInLeftSchema(table)) fill = 'rgb(245, 255, 255)';
    return [
      {
        tagName: 'circle',
        attributes: {
          r: this.columnHeight / 2,
          cx,
          fill,
          cy:
            this.graphElementHeaderHeight + this.columnHeight * (counter + 0.5),
        },
      },
    ];
  }

  private generatePorts(jointjsEl: joint.dia.Element, table: BasicTable) {
    let counter = 0;
    for (let column of this.schemaService.schema.displayedColumnsOf(table)) {
      jointjsEl.addPort({
        id: column.name + '_left', // generated if `id` value is not present
        group: 'ports-left',
        markup: this.generatePortMarkup(counter, PortSide.Left, table),
      });
      jointjsEl.addPort({
        id: column.name + '_right', // generated if `id` value is not present
        group: 'ports-right',
        markup: this.generatePortMarkup(counter, PortSide.Right, table),
      });
      counter++;
    }
  }

  public centerOnSelectedTable() {
    if (!this.schemaService.selectedTable) return;
    // center on selectedTable
    const paper = document.querySelector('#paper svg') as SVGElement;
    const bbox = this.graphStorage
      .get(this.schemaService.selectedTable)
      ?.jointjsEl.getBBox();
    if (!bbox) return;
    const offsetX =
      paper.getBoundingClientRect().width / 2 -
      this.panzoomTransform.scale * (bbox.x + bbox.width / 2);
    const offsetY =
      paper.getBoundingClientRect().height / 2 -
      this.panzoomTransform.scale * (bbox.y + bbox.height / 2);

    this.panzoomHandler?.smoothMoveTo(offsetX, offsetY);
  }

  public resetView() {
    this.panzoomHandler?.moveTo(0, 0);
    this.panzoomHandler?.zoomAbs(0, 0, 1);
  }

  private updateAllBBoxes() {
    for (const item of this.graphStorage.keys()) {
      this.updateBBox(this.graphStorage.get(item)!);
    }
  }

  // call this whenever the graph element has moved, this moves the angular component on top of the graph element
  private updateBBox(item: GraphStorageItem) {
    const bbox = item.jointjsEl.getBBox();

    item.style = {
      width: bbox.width + 'px',
      height: bbox.height + 'px',
      left:
        bbox.x * this.panzoomTransform.scale + this.panzoomTransform.x + 'px',
      top:
        bbox.y * this.panzoomTransform.scale + this.panzoomTransform.y + 'px ',
      transform: `scale(${this.panzoomTransform.scale})`,
      'transform-origin': 'left top',
    };
  }
}
