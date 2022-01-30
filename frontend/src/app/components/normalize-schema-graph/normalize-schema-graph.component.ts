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

  protected localTables: Set<Table> = new Set();
  protected panzoomTransform: Transform = { x: 0, y: 0, scale: 1 };

  protected portDiameter = 22.5;

  public graphStorage: Record<string, GraphStorageItem> = {};

  protected graph!: joint.dia.Graph;
  protected paper!: joint.dia.Paper;

  protected elementWidth = 300;

  ngAfterViewInit(): void {
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

    // move the corresponding HTML overlay whenever a graph element changes position
    this.graph.on('change:position', (element) => {
      if (element.isElement)
        for (const item of Object.values(this.graphStorage)) {
          if (item.jointjsEl == element) {
            this.updateBBox(item);
          }
        }
    });

    this.addPanzoomHandler();

    this.tables.asObservable().subscribe((v) => {
      console.log('new tables. count ' + v.size);
      this.localTables = v;
      this.updateGraph();
    });
  }

  updateGraph() {
    for (const item in this.graphStorage) {
      this.graphStorage[item].jointjsEl.remove();
    }
    this.graphStorage = {};
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

  // We use the panzoom library becuase pan and zoom detection is difficult and must
  // feel intuitive on a range of devices. We just take the transform and override the
  // default panzoom conotroller to move both the graph elements and the associated Angular
  // components
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

  generateLinks() {
    for (const table of this.localTables) {
      for (const otherTable of table.minimalReferencedTables()) {
        let foreignKey = table
          .foreignKeyForReferencedTable(otherTable)
          .columns.values()
          .next().value;
        this.graphStorage[table.name].links[otherTable.name] =
          new joint.dia.Link({
            source: {
              id: this.graphStorage[table.name].jointjsEl.id,
              port: foreignKey.name + '_left',
            },
            target: {
              id: this.graphStorage[otherTable.name].jointjsEl.id,
              port: foreignKey.name + '_right',
            },
          });
      }
      this.graph.addCells(Object.values(this.graphStorage[table.name].links));
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
        id: column.name + '_right', // generated if `id` value is not present
        group: 'ports-right',
        args,
        markup: this.generatePortMarkup(args),
      });
      args = { counter, side: PortSide.Right };
      jointjsEl.addPort({
        id: column.name + '_left', // generated if `id` value is not present
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
