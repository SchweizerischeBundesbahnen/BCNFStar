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

  ngAfterViewInit(): void {
    this.tables.asObservable().subscribe((v) => {
      console.log('new tables');
      this.localTables = v;
      this.createDefaultGraph();
    });
  }

  protected portWidth = 22.5;

  public graphStorage: Record<string, GraphStorageItem> = {};

  protected graph!: joint.dia.Graph;

  // The graph helps us with creating links, moving elements and rendering them as SVG
  // However, we only create blank elements and put custom Angular components over them
  // Idea is from here: https://resources.jointjs.com/tutorial/html-elements
  createDefaultGraph() {
    this.graph = new joint.dia.Graph();

    new joint.dia.Paper({
      el: document.getElementById('paper') || undefined,
      model: this.graph,
      height: null,
      width: null,
      background: {
        color: 'rgba(200, 200, 200, 0.3)',
      },
    });

    // Order is important, elements need to be there when links are generated
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
      marginX: this.portWidth / 2,
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
          const delta = {
            x: transform.x - this.panzoomTransform.x,
            y: transform.y - this.panzoomTransform.y,
            scale: transform.scale / this.panzoomTransform.scale,
          };
          this.panzoomTransform = Object.assign({}, transform);
          for (const el of this.graph.getElements()) {
            const position = el.position();
            el.position(position.x + delta.x, position.y + delta.y);
            el.scale(delta.scale, delta.scale);
          }
          this.updateAllBBoxes();
        },
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
      jointjsEl.resize(300, 60 + this.portWidth * table.columns.columns.size);
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
        markup: `<circle r="${this.portWidth / 2}" cx="0" cy="${
          25 + this.portWidth / 2 + this.portWidth * counter
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
        markup: `<circle r="${this.portWidth / 2}" cx="300" cy="${
          25 + this.portWidth / 2 + this.portWidth * counter
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
    const bbox = item.jointjsEl.getBBox();

    item.style = {
      width: bbox.width / this.panzoomTransform.scale + 'px',
      height: bbox.height / this.panzoomTransform.scale + 'px',
      left: bbox.x + 'px',
      top: bbox.y + 'px ',
      transform: `scale(${this.panzoomTransform.scale})`,
      'transform-origin': 'left top',
    };
  }
}
