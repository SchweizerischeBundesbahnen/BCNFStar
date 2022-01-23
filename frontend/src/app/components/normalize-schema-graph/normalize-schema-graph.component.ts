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
// import panzoom, { PanZoom, Transform } from 'panzoom';
import { Transform } from 'panzoom';
import { Subject } from 'rxjs';

type GraphStorageItem = {
  jointjsEl: joint.dia.Element;
  table: Table;
  style: Record<string, any>;
  links: Record<string, joint.dia.Link>;
};

const jointJsPrefix = '__jointel__';

@Component({
  selector: 'app-normalize-schema-graph',
  templateUrl: './normalize-schema-graph.component.html',
  styleUrls: ['./normalize-schema-graph.component.css'],
})
export class NormalizeSchemaGraphComponent implements AfterViewInit {
  @Input() tables!: Subject<Set<Table>>;
  @Input() selectedTable?: Table;
  @Output() selected = new EventEmitter<Table>();
  @Output() join = new EventEmitter<{ source: Table; target: Table }>();

  protected localTables: Set<Table> = new Set();
  public paper?: joint.dia.Paper;

  ngAfterViewInit(): void {
    this.tables.asObservable().subscribe((v) => {
      console.log('new tables');
      this.localTables = v;
      this.createDefaultGraph();
    });
  }

  private panzoomTransform: Transform = { x: 0, y: 0, scale: 1 };

  protected attributeWidth = 22.5;

  public graphStorage: Record<string, GraphStorageItem> = {};

  protected graph!: joint.dia.Graph;

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
    // move the corresponding HTML overlay whenever a graph element changes position
    this.graph.on('change:position', (element) => {
      if (element.isElement)
        for (const item of Object.values(this.graphStorage)) {
          if (item.jointjsEl == element) {
            this.updateBBox(item);
          }
        }
    });

    this.paper.on('link:pointerclick', (linkView) => {
      // resetAll(this);
      console.log('Klick');
      let sourceId = linkView.sourceView.el.id.replace(jointJsPrefix, '');
      let targetId = linkView.targetView.el.id.replace(jointJsPrefix, '');
      this.join.emit({
        source: this.graphStorage[sourceId].table,
        target: this.graphStorage[targetId].table,
      });
      this.createDefaultGraph();
    });

    this.generateElements();
    this.generateLinks();
    joint.layout.DirectedGraph.layout(this.graph, {
      dagre,
      graphlib,
      nodeSep: 40,
      // prevent left ports from being cut off
      marginX: this.attributeWidth / 2,
      edgeSep: 80,
      rankDir: 'LR',
    });

    // setTimeout(() => {
    //   const panzoomHandler = panzoom(
    //     document.querySelector('#paper svg') as SVGElement,
    //     { smoothScroll: false,
    //     pinchSpeed:0,
    //   zoomSpeed: 0 }
    //   );
    //   // move all HTML overlays whenever the user zoomed or panned
    //   panzoomHandler.on('transform', (e: PanZoom) => {
    //     this.panzoomTransform = e.getTransform();
    //     this.updateAllBBoxes();
    //   });
    //   this.updateAllBBoxes();
    // }, 10);
  }

  generateElements() {
    for (const table of this.localTables) {
      const jointjsEl = new joint.shapes.standard.Rectangle({
        attrs: { root: { id: jointJsPrefix + table.name } },
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

  private addJoinButton(link: joint.shapes.standard.Link) {
    let joinButton = new joint.linkTools.Button({
      markup: [
        {
          tagName: 'circle',
          selector: 'button',
          attributes: {
            r: 7,
            fill: '#001DFF',
            cursor: 'pointer',
          },
        },
        {
          tagName: 'path',
          selector: 'icon',
          attributes: {
            d: 'M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4',
            fill: 'none',
            stroke: '#FFFFFF',
            'stroke-width': 2,
            'pointer-events': 'none',
          },
        },
      ],
      distance: 60,
      offset: 0,
      action: function () {
        alert(link);
      },
    });

    var toolsView = new joint.dia.ToolsView({
      tools: [joinButton],
    });

    var linkView = link.findView(this.paper!);
    linkView.addTools(toolsView);
  }

  generateLinks() {
    for (const table of this.localTables) {
      for (const otherTable of table.minimalReferencedTables()) {
        let foreignKey = table
          .foreignKeyForReferencedTable(otherTable)!
          .columns.values()
          .next().value;
        let link = new joint.shapes.standard.Link({
          source: {
            id: this.graphStorage[table.name].jointjsEl.id,
            port: foreignKey.sourceTable.name + '.' + foreignKey.name + '_left',
          },
          target: {
            id: this.graphStorage[otherTable.name].jointjsEl.id,
            port:
              foreignKey.sourceTable.name + '.' + foreignKey.name + '_right',
          },
        });
        this.addJoinButton(link);
        link = this.graphStorage[table.name].links[otherTable.name];
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
