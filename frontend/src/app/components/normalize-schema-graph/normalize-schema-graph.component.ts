import {
  Component,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import * as joint from 'jointjs';
import Table from 'src/model/schema/Table';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
import panzoom, { Transform } from 'panzoom';
import { Subject } from 'rxjs';
import Relationship from '@/src/model/schema/Relationship';

type GraphStorageItem = {
  jointjsEl: joint.dia.Element;
  table: Table;
  style: Record<string, any>;
  links: Record<string, joint.dia.Link>;
};

enum PortSide {
  Left,
  Right,
}

@Component({
  selector: 'app-normalize-schema-graph',
  templateUrl: './normalize-schema-graph.component.html',
  styleUrls: ['./normalize-schema-graph.component.css'],
})
export class NormalizeSchemaGraphComponent implements AfterViewInit {
  @Input() tables!: Subject<Set<Table>>;
  @Input() selectedTable?: Table;
  @Output() selected = new EventEmitter<Table>();
  @Output() joinFk = new EventEmitter<{
    source: Table;
    target: Table;
    relationship: Relationship;
  }>();

  protected localTables: Set<Table> = new Set();

  ngAfterViewInit(): void {
    this.tables.asObservable().subscribe((v) => {
      console.log('new tables. count ' + v.size);
      this.localTables = v;
      this.createDefaultGraph();
    });
  }

  protected portDiameter = 22.5;

  public graphStorage: Record<string, GraphStorageItem> = {};

  protected graph!: joint.dia.Graph;
  protected paper!: joint.dia.Paper;

  // The graph helps us with creating links, moving elements and rendering them as SVG
  // However, we only create blank elements and put custom Angular components over them
  // Idea is from here: https://resources.jointjs.com/tutorial/html-elements
  createDefaultGraph() {
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

    // Order is important, elements need to be there when links are generated
    this.graphStorage = {};
    this.generateElements();
    this.generateLinks();

    // move the corresponding HTML overlay whenever a graph element changes position
    this.graph.on('change:position', (element) => {
      if (element.isElement)
        for (const item of Object.values(this.graphStorage)) {
          if (item.jointjsEl == element) {
            this.updateBBox(item);
          }
        }
    });
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
    this.addPanzoomHandler();
  }

  // We use the panzoom library becuase pan and zoom detection is difficult and must
  // feel intuitive on a range of devices. We just take the transform and override the
  // default panzoom conotroller to move both the graph elements and the associated Angular
  // components
  protected panzoomTransform: Transform = { x: 0, y: 0, scale: 1 };
  addPanzoomHandler() {
    panzoom(document.querySelector('#paper svg') as SVGElement, {
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
    });
  }

  protected elementWidth = 300;
  generateElements() {
    for (const table of this.localTables) {
      const jointjsEl = new joint.shapes.standard.Rectangle({
        attrs: { root: { id: '__jointel__' + table.name } },
      });
      jointjsEl.attr({
        body: {
          strokeWidth: 0,
        },
        '.': { magnet: true },
      });
      jointjsEl.resize(
        this.elementWidth,
        60 + this.portDiameter * table.columns.columns.size
      );
      this.graphStorage[table.name] = {
        // alternative to HtmlElement: joint.shapes.html.Element
        jointjsEl,
        style: {},
        table,
        links: {},
      };
      this.generatePorts(jointjsEl, table);
      this.graph.addCell(jointjsEl);
    }
  }

  private addJoinButton(
    link: joint.shapes.standard.Link,
    sourceTable: Table,
    targetTable: Table,
    relationship: Relationship
  ) {
    let joinTablesOnFks = () => {
      this.joinFk.emit({
        source: sourceTable,
        target: targetTable,
        relationship: relationship,
      });
    };

    let joinButton = new joint.linkTools.Button({
      markup: [
        {
          tagName: 'circle',
          selector: 'button',
          attributes: {
            r: 15,
            fill: '#001DFF',
            cursor: 'pointer',
          },
        },
        {
          tagName: 'path',
          selector: 'icon',
          attributes: {
            // d: 'M 14.45 2.15 L 14.45 3.02 Q 14.73 2.6 15.165 2.315 A 1.732 1.732 0 0 1 15.876 2.053 A 2.263 2.263 0 0 1 16.2 2.03 A 2.322 2.322 0 0 1 16.707 2.082 Q 17.041 2.157 17.285 2.339 A 1.326 1.326 0 0 1 17.515 2.56 A 1.84 1.84 0 0 1 17.875 3.298 Q 17.941 3.562 17.949 3.871 A 3.377 3.377 0 0 1 17.95 3.96 L 17.95 7.35 L 17.05 7.35 L 17.05 4.06 Q 17.05 3.49 16.79 3.155 A 0.846 0.846 0 0 0 16.195 2.828 A 1.239 1.239 0 0 0 16.05 2.82 Q 15.82 2.82 15.6 2.905 A 1.817 1.817 0 0 0 15.23 3.101 A 2.063 2.063 0 0 0 15.175 3.14 Q 14.97 3.29 14.795 3.49 Q 14.62 3.69 14.48 3.91 L 14.48 7.35 L 13.58 7.35 L 13.58 2.15 L 14.45 2.15 Z M 2.55 5.14 L 2.55 0.35 L 3.5 0.35 L 3.5 5.04 A 4.92 4.92 0 0 1 3.477 5.53 Q 3.443 5.867 3.36 6.14 A 2.401 2.401 0 0 1 3.208 6.523 A 1.754 1.754 0 0 1 2.96 6.895 Q 2.7 7.19 2.34 7.33 A 2.059 2.059 0 0 1 1.807 7.456 A 2.548 2.548 0 0 1 1.54 7.47 Q 1.08 7.47 0.675 7.31 A 2.283 2.283 0 0 1 0.283 7.112 A 1.818 1.818 0 0 1 0 6.89 L 0.46 6.16 A 1.686 1.686 0 0 0 0.867 6.472 A 1.943 1.943 0 0 0 0.94 6.51 Q 1.22 6.65 1.51 6.65 A 1.092 1.092 0 0 0 1.854 6.598 A 0.893 0.893 0 0 0 2.27 6.31 A 0.963 0.963 0 0 0 2.424 6.034 Q 2.55 5.698 2.55 5.14 Z M 4.756 4.116 A 3.42 3.42 0 0 0 4.7 4.75 A 3.47 3.47 0 0 0 4.713 5.053 A 2.872 2.872 0 0 0 4.895 5.85 Q 5.09 6.35 5.435 6.71 Q 5.78 7.07 6.255 7.27 A 2.465 2.465 0 0 0 6.56 7.376 A 2.749 2.749 0 0 0 7.29 7.47 A 3.045 3.045 0 0 0 7.392 7.468 A 2.643 2.643 0 0 0 8.315 7.275 Q 8.79 7.08 9.14 6.72 A 2.382 2.382 0 0 0 9.325 6.506 A 2.616 2.616 0 0 0 9.685 5.855 Q 9.88 5.35 9.88 4.73 Q 9.88 4.11 9.68 3.61 A 2.872 2.872 0 0 0 9.614 3.457 A 2.442 2.442 0 0 0 9.13 2.76 Q 8.78 2.41 8.305 2.22 Q 7.83 2.03 7.29 2.03 A 3.115 3.115 0 0 0 7.171 2.032 A 2.698 2.698 0 0 0 6.265 2.22 Q 5.79 2.41 5.445 2.76 A 2.326 2.326 0 0 0 5.207 3.044 A 2.68 2.68 0 0 0 4.9 3.615 A 2.731 2.731 0 0 0 4.756 4.116 Z M 11.98 2.15 L 11.98 7.35 L 11.08 7.35 L 11.08 2.15 L 11.98 2.15 Z M 8.96 4.75 Q 8.96 4.36 8.835 4.01 A 1.956 1.956 0 0 0 8.597 3.545 A 1.771 1.771 0 0 0 8.485 3.4 Q 8.26 3.14 7.955 2.985 Q 7.65 2.83 7.29 2.83 A 1.925 1.925 0 0 0 6.767 2.897 A 1.404 1.404 0 0 0 6.06 3.35 A 1.788 1.788 0 0 0 5.693 4.087 Q 5.627 4.353 5.621 4.665 A 3.288 3.288 0 0 0 5.62 4.73 Q 5.62 5.12 5.745 5.475 A 2.013 2.013 0 0 0 5.976 5.939 A 1.815 1.815 0 0 0 6.095 6.095 Q 6.32 6.36 6.625 6.515 Q 6.93 6.67 7.29 6.67 A 1.869 1.869 0 0 0 7.682 6.631 A 1.519 1.519 0 0 0 7.99 6.53 Q 8.3 6.39 8.515 6.135 A 1.737 1.737 0 0 0 8.79 5.679 A 2.07 2.07 0 0 0 8.845 5.53 A 2.28 2.28 0 0 0 8.943 5.064 A 2.901 2.901 0 0 0 8.96 4.75 Z M 11.091 1.081 A 0.606 0.606 0 0 0 11.53 1.26 A 0.826 0.826 0 0 0 11.696 1.244 A 0.566 0.566 0 0 0 11.99 1.09 A 0.559 0.559 0 0 0 12.137 0.827 A 0.799 0.799 0 0 0 12.16 0.63 A 0.725 0.725 0 0 0 12.16 0.622 A 0.606 0.606 0 0 0 11.975 0.185 A 0.738 0.738 0 0 0 11.969 0.179 A 0.606 0.606 0 0 0 11.53 0 A 0.826 0.826 0 0 0 11.364 0.016 A 0.566 0.566 0 0 0 11.07 0.17 A 0.559 0.559 0 0 0 10.923 0.433 A 0.799 0.799 0 0 0 10.9 0.63 A 0.725 0.725 0 0 0 10.9 0.638 A 0.606 0.606 0 0 0 11.085 1.075 A 0.738 0.738 0 0 0 11.091 1.081 Z',
            d: 'M 2.55 4.79 L 2.55 0 L 3.5 0 L 3.5 4.69 A 4.92 4.92 0 0 1 3.477 5.18 Q 3.443 5.517 3.36 5.79 A 2.401 2.401 0 0 1 3.208 6.173 A 1.754 1.754 0 0 1 2.96 6.545 Q 2.7 6.84 2.34 6.98 A 2.059 2.059 0 0 1 1.807 7.106 A 2.548 2.548 0 0 1 1.54 7.12 Q 1.08 7.12 0.675 6.96 A 2.283 2.283 0 0 1 0.283 6.762 A 1.818 1.818 0 0 1 0 6.54 L 0.46 5.81 A 1.686 1.686 0 0 0 0.867 6.122 A 1.943 1.943 0 0 0 0.94 6.16 Q 1.22 6.3 1.51 6.3 A 1.092 1.092 0 0 0 1.854 6.248 A 0.893 0.893 0 0 0 2.27 5.96 A 0.963 0.963 0 0 0 2.424 5.684 Q 2.55 5.348 2.55 4.79 Z',
            fill: 'white',
            stroke: '#FFFFFF',
            'stroke-width': 2,
            'pointer-events': 'none',
          },
        },
      ],
      distance: '50%',
      offset: 0,
      action: joinTablesOnFks,
    });

    var toolsView = new joint.dia.ToolsView({
      tools: [joinButton],
    });

    var linkView = link.findView(this.paper!);
    linkView.addTools(toolsView);
  }

  generateLinks() {
    for (const table of this.localTables) {
      for (const fk of table.fks()) {
        let fkReferenced = fk.relationship
          .referenced()
          .columns.values()
          .next().value;
        let fkReferencing = fk.relationship
          .referencing()
          .columns.values()
          .next().value;
        console.log(
          fkReferenced.sourceTable.name,
          fkReferencing.sourceTable.name
        );
        let link = new joint.shapes.standard.Link({
          source: {
            id: this.graphStorage[table.name].jointjsEl.id,
            port:
              fkReferencing.sourceTable.name +
              '.' +
              fkReferencing.name +
              '_right',
          },
          target: {
            id: this.graphStorage[fk.table.name].jointjsEl.id,
            port:
              fkReferenced.sourceTable.name + '.' + fkReferenced.name + '_left',
          },
        });
        console.log(link);
        this.graphStorage[table.name].links[fk.table.name] = link;
        this.graph.addCell(link);
        this.addJoinButton(link, table, fk.table, fk.relationship);
      }
    }
  }

  generatePortMarkup({ counter, side }: { counter: number; side: PortSide }) {
    const sclaedPortRadius =
      (this.portDiameter * this.panzoomTransform.scale) / 2;

    const cx =
      side == PortSide.Left
        ? 0
        : this.elementWidth * this.panzoomTransform.scale;
    return `<circle r="${sclaedPortRadius}" cx="${cx}" cy="${
      25 + sclaedPortRadius + sclaedPortRadius * 2 * counter
    }" strokegit ="green" fill="white"/>`;
  }

  generatePorts(jointjsEl: joint.dia.Element, table: Table) {
    let counter = 0;
    for (let column of table.columns.inOrder()) {
      let args = { counter, side: PortSide.Left };
      jointjsEl.addPort({
        id: column.sourceTable.name + '.' + column.name + '_right', // generated if `id` value is not present
        group: 'ports-right',
        args,
        markup: this.generatePortMarkup(args),
      });
      args = { counter, side: PortSide.Right };
      jointjsEl.addPort({
        id: column.sourceTable.name + '.' + column.name + '_left', // generated if `id` value is not present
        group: 'ports-left',
        args,
        markup: this.generatePortMarkup(args),
      });
      counter++;
    }
  }

  updateAllBBoxes() {
    for (const item in this.graphStorage) {
      this.updateBBox(this.graphStorage[item]);
    }
  }

  // call this whenever the graph element has moved, this moves the angular component on top of the graph element
  updateBBox(item: GraphStorageItem) {
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
