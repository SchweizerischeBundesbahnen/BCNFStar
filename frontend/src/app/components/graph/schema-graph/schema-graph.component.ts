import {
  Component,
  AfterContentInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import * as joint from 'jointjs';
import Table from 'src/model/schema/Table';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
import panzoom, { PanZoom, Transform } from 'panzoom';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { SchemaService } from '@/src/app/schema.service';

type GraphStorageItem = {
  jointjsEl: joint.dia.Element;
  style: Record<string, any>;
  links: Map<Table, joint.dia.Link>;
};

enum PortSide {
  Left,
  Right,
}

@Component({
  selector: 'app-schema-graph',
  templateUrl: './schema-graph.component.html',
  styleUrls: ['./schema-graph.component.css'],
})
export class SchemaGraphComponent implements AfterContentInit, OnChanges {
  protected panzoomTransform: Transform = { x: 0, y: 0, scale: 1 };

  protected portDiameter = 22.5;

  public graphStorage = new Map<Table, GraphStorageItem>();

  protected graph!: joint.dia.Graph;
  protected paper!: joint.dia.Paper;

  protected elementWidth = 300;

  constructor(private schemaService: SchemaService) {}

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
    this.schemaService.schemaChanged.subscribe(() => {
      this.updateGraph();
      this.centerOnSelectedTable();
    });
    this.updateGraph();
    this.centerOnSelectedTable();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedTable']) this.centerOnSelectedTable();
  }

  public updateGraph() {
    for (const item of this.graphStorage.keys()) {
      this.graphStorage.get(item)?.jointjsEl.remove();
    }
    this.graphStorage = new Map<Table, GraphStorageItem>();
    this.generateElements();
    this.generateLinks();
    joint.layout.DirectedGraph.layout(this.graph, {
      dagre,
      graphlib,
      nodeSep: 40,
      // prevent left ports from being cut off
      marginX: this.portDiameter / 2,
      edgeSep: 80,
      rankDir: 'LR',
    });

    setTimeout(() => {
      this.updateAllBBoxes();
    }, 10);
  }

  protected panzoomHandler?: PanZoom;
  // We use the panzoom library becuase pan and zoom detection is difficult and must
  // feel intuitive on a range of devices. We just take the transform and override the
  // default panzoom conotroller to move both the graph elements and the associated Angular
  // components
  private addPanzoomHandler() {
    this.panzoomHandler = panzoom(
      document.querySelector('#paper svg') as SVGElement,
      {
        smoothScroll: false,
        controller: {
          getOwner() {
            return document.querySelector('#paper') as HTMLElement;
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
    for (const table of this.schemaService.schema.tables) {
      const jointjsEl = new joint.shapes.standard.Rectangle({
        attrs: { root: { id: '__jointel__' + table.fullName } },
      });
      jointjsEl.attr({
        body: {
          strokeWidth: 0,
        },
        '.': { magnet: true },
      });
      jointjsEl.resize(
        this.elementWidth,
        60 +
          this.portDiameter *
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

  private addJoinButton(
    link: joint.shapes.standard.Link,
    fk: TableRelationship
  ) {
    let joinButton = new joint.linkTools.Button({
      markup: [
        {
          tagName: 'circle',
          selector: 'button',
          attributes: {
            r: 11,
            fill: '#2d327d',
            cursor: 'pointer',
          },
        },
        {
          tagName: 'path',
          selector: 'icon',
          attributes: {
            d: 'M 0.715 2.327 L 0.715 -3.9 L 1.95 -3.9 L 1.95 2.197 A 6.396 6.396 90 0 1 1.9201 2.834 Q 1.8759 3.2721 1.768 3.627 A 3.1213 3.1213 90 0 1 1.5704 4.1249 A 2.2802 2.2802 90 0 1 1.248 4.6085 Q 0.91 4.992 0.442 5.174 A 2.6767 2.6767 90 0 1 -0.2509 5.3378 A 3.3124 3.3124 90 0 1 -0.598 5.356 Q -1.196 5.356 -1.7225 5.148 A 2.9679 2.9679 90 0 1 -2.2321 4.8906 A 2.3634 2.3634 90 0 1 -2.6 4.602 L -2.002 3.653 A 2.1918 2.1918 90 0 0 -1.4729 4.0586 A 2.5259 2.5259 90 0 0 -1.378 4.108 Q -1.014 4.29 -0.637 4.29 A 1.4196 1.4196 90 0 0 -0.1898 4.2224 A 1.1609 1.1609 90 0 0 0.351 3.848 A 1.2519 1.2519 90 0 0 0.5512 3.4892 Q 0.715 3.0524 0.715 2.327 Z',
            fill: 'white',
            stroke: '#FFFFFF',
            'stroke-width': 2,
            'pointer-events': 'none',
          },
        },
      ],
      distance: '50%',
      offset: 0,
      action: () => this.schemaService.join(fk),
    });

    var toolsView = new joint.dia.ToolsView({
      tools: [joinButton],
    });

    var linkView = link.findView(this.paper!);
    linkView.addTools(toolsView);
  }

  private generateLinks() {
    for (const table of this.schemaService.schema.tables) {
      for (const fk of this.schemaService.schema.fksOf(table)) {
        const referencedName = fk.referenced.implementsSurrogateKey()
          ? fk.referenced.surrogateKey
          : fk.relationship.referenced[0].name;
        const referencingName = fk.referenced.implementsSurrogateKey()
          ? fk.referenced.surrogateKey +
            '_' +
            fk.relationship.referencing.map((col) => col.name).join('_')
          : fk.relationship.referencing[0].name;
        let link = new joint.shapes.standard.Link({
          source: {
            id: this.graphStorage.get(table)?.jointjsEl.id,
            port: referencingName + '_right',
          },
          target: {
            id: this.graphStorage.get(fk.referenced)?.jointjsEl.id,
            port: referencedName + '_left',
          },
          z: -1,
        });
        link.attr({
          line: {
            sourceMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 Z',
            },
            targetMarker: {
              type: 'none',
            },
          },
        });
        this.graphStorage.get(table)?.links.set(fk.referenced, link);
        this.graph.addCell(link);
        this.addJoinButton(link, fk);
      }
    }
  }

  // if you change this, also change graph-element.component.css > .table-head > height
  protected graphElementHeaderHeight: number = 25;
  private generatePortMarkup({
    counter,
    side,
  }: {
    counter: number;
    side: PortSide;
  }) {
    const cx = side == PortSide.Left ? 0 : this.elementWidth;
    return `<circle r="${this.portDiameter / 2}" cx="${cx}" cy="${
      this.graphElementHeaderHeight + this.portDiameter * (counter + 0.5)
    }" strokegit ="green" fill="white"/>`;
  }

  private generatePorts(jointjsEl: joint.dia.Element, table: Table) {
    let counter = 0;
    for (let column of this.schemaService.schema.displayedColumnsOf(table)) {
      let args = { counter, side: PortSide.Left };
      jointjsEl.addPort({
        id: column.name + '_left', // generated if `id` value is not present
        group: 'ports-left',
        args,
        markup: this.generatePortMarkup(args),
      });
      args = { counter, side: PortSide.Right };
      jointjsEl.addPort({
        id: column.name + '_right', // generated if `id` value is not present
        group: 'ports-right',
        args,
        markup: this.generatePortMarkup(args),
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
