import {
  Component,
  ElementRef,
  Input,
  Output,
  ViewChild,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as joint from 'jointjs';
import Table from 'src/model/schema/Table';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
import panzoom, { PanZoom, Transform } from 'panzoom';

type GraphStorageItem = {
  jointjsEl: joint.dia.Element;
  table: Table;
  style: Record<string, any>;
  links: Record<string, joint.dia.Link>;
};

@Component({
  selector: 'app-normalize-schema-graph',
  templateUrl: './normalize-schema-graph.component.html',
  styleUrls: ['./normalize-schema-graph.component.css'],
})
export class NormalizeSchemaGraphComponent implements OnChanges {
  @Input() tables!: Set<Table>;
  @Input() selectedTable?: Table;
  @Output() selected = new EventEmitter<Table>();

  ngOnChanges(changes: SimpleChanges) {
    changes;
    this.createDefaultGraph();
  }

  private panzoomTransform: Transform = { x: 0, y: 0, scale: 1 };

  protected attributeWidth = 22.5;

  public graphStorage: Record<string, GraphStorageItem> = {};

  protected graph!: joint.dia.Graph;

  private height = 10000;
  createDefaultGraph() {
    this.graph = new joint.dia.Graph();

    new joint.dia.Paper({
      el: document.getElementById('paper') || undefined,
      model: this.graph,
      height: this.height,
      width: '100%',
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

    this.generateElements();
    this.generateLinks();
    joint.layout.DirectedGraph.layout(this.graph, {
      dagre,
      graphlib,
      nodeSep: 40,
      edgeSep: 80,
      rankDir: 'LR',
    });

    setTimeout(() => {
      const panzoomHandler = panzoom(
        document.querySelector('#paper svg') as SVGElement
      );
      // move all HTML overlays whenever the user zoomed or panned
      panzoomHandler.on('transform', (e: PanZoom) => {
        this.panzoomTransform = e.getTransform();
        this.updateAllBBoxes();
      });
      this.updateAllBBoxes();
    }, 10);
  }
  @ViewChild('paper') paperHtmlObject!: ElementRef<HTMLDivElement>;
  get paperOffset() {
    try {
      const { top, left } =
        this.paperHtmlObject.nativeElement.getBoundingClientRect();
      return { top: top + window.scrollY, left: left + window.scrollX };
    } catch (e) {
      return { top: 0, left: 0 };
    }
  }

  generateElements() {
    for (const table of this.tables) {
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
        300,
        60 + this.attributeWidth * table.columns.columns.size
      );
      jointjsEl.position(50, 10);
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
    for (const table of this.tables) {
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

  generatePorts(jointjsEl: joint.dia.Element, table: Table) {
    let counter = 0;
    for (let column of table.columns.inOrder()) {
      jointjsEl.addPort({
        id: column.name + '_right', // generated if `id` value is not present
        group: 'ports-right',
        args: {}, // extra arguments for the port layout function, see `layout.Port` section
        label: {
          position: {
            name: 'right',
            // args: { y: 60 + 22.5 * i } // extra arguments for the label layout function, see `layout.PortLabel` section
          },
        },
        markup: `<circle r="${this.attributeWidth / 2}" cx="0" cy="${
          25 + this.attributeWidth / 2 + this.attributeWidth * counter
        }" strokegit ="green" fill="white" />`,
      });
      jointjsEl.addPort({
        id: column.name + '_left', // generated if `id` value is not present
        group: 'ports-left',
        args: {}, // extra arguments for the port layout function, see `layout.Port` section
        label: {
          position: {
            name: 'left',
            // args: { y: 60 + 22.5 * i } // extra arguments for the label layout function, see `layout.PortLabel` section
          },
        },
        markup: `<circle r="${this.attributeWidth / 2}" cx="300" cy="${
          25 + this.attributeWidth / 2 + this.attributeWidth * counter
        }" strokegit ="red" fill="white" />`,
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
    const bbox = document
      .getElementById('__jointel__' + item.table.name)
      ?.children[0].getBoundingClientRect();
    if (!bbox) return;

    item.style = {
      width: bbox.width / this.panzoomTransform.scale + 'px',
      height: bbox.height / this.panzoomTransform.scale + 'px',
      left: bbox.left + window.scrollX + 'px',
      top: bbox.top + window.scrollY + 'px ',
      transform: `scale(${this.panzoomTransform.scale})`,
      'transform-origin': 'left top',
    };

    // const domel = document.getElementById('__jointel__' + item.table.name);
    // domel?.setAttribute('transform', `translate(${bbox.x}, ${bbox.y})`);
  }
}
