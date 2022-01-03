import {
  Component,
  ElementRef,
  Input,
  Output,
  ViewChild,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import * as joint from 'jointjs';
import Table from 'src/model/schema/Table';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';

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
export class NormalizeSchemaGraphComponent implements OnChanges, AfterViewInit {
  constructor() {}
  @Input() tables!: Array<Table>;
  @Input() selectedTable?: Table;
  @Output() selected = new EventEmitter<Table>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tables']) this.createDefaultGraph();
  }

  ngAfterViewInit(): void {
    for (const name in this.graphStorage) {
      const item = this.graphStorage[name];
      this.updateBBox(item);
    }
  }

  protected attributeWidth = 22.5;

  public graphStorage: Record<string, GraphStorageItem> = {};

  createDefaultGraph() {
    let graph = new joint.dia.Graph();

    let paper = new joint.dia.Paper({
      el: document.getElementById('paper') || undefined,
      model: graph,
      height: 1000,
      width: '100%',
      gridSize: 1,
      drawGrid: true,
      background: {
        color: 'rgba(200, 200, 200, 0.3)',
      },
    });
    graph.on('change:position', (element) => {
      if (element.isElement)
        for (const item of Object.values(this.graphStorage)) {
          if (item.jointjsEl == element) {
            this.updateBBox(item);
          }
        }
    });

    // generate elements
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

      this.graphStorage[table.name] = {
        // alternative to HtmlElement: joint.shapes.html.Element
        jointjsEl,
        style: {},
        table,
        links: {},
      };
      graph.addCell(jointjsEl);
    }

    // generate links
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
      graph.addCells(Object.values(this.graphStorage[table.name].links));
    }
    joint.layout.DirectedGraph.layout(graph, {
      dagre,
      graphlib,
      nodeSep: 40,
      edgeSep: 80,
      rankDir: 'LR',
    });

    // var link = new joint.dia.Link({
    //   source: { id: rect.id },
    //   target: { id: rect2.id },
    // });

    paper.on('element:pointerup', function () {
      // alert('Hello')
    });
    // graph.addCells([rect, rect2, link]);
  }
  @ViewChild('paper') paperHtmlObject!: ElementRef<HTMLDivElement>;
  get paperOffset() {
    const { top, left } =
      this.paperHtmlObject.nativeElement.getBoundingClientRect();
    return { top, left };
  }

  updateBBox(item: GraphStorageItem) {
    const bbox = item.jointjsEl.getBBox();
    item.jointjsEl.position(bbox.x, bbox.y);
    item.style = {
      width: bbox.width + 'px',
      height: bbox.height + 'px',
      left: bbox.x + this.paperOffset.left + 'px',
      top: bbox.y + this.paperOffset.top + 'px ',
      // transform: 'rotate(' + (this.get('angle') || 0) + 'deg)'
    };

    const domel = document.getElementById('__jointel__' + item.table.name);
    domel?.setAttribute('transform', `translate(${bbox.x}, ${bbox.y})`);
  }

  createTableBox(
    graph: joint.dia.Graph<
      joint.dia.Graph.Attributes,
      joint.dia.ModelSetOptions
    >,
    numAttr: number = 1
  ) {
    let rectangle = new joint.shapes.standard.HeaderedRectangle();
    rectangle.resize(100, 100);
    rectangle.position(50, 10);
    rectangle.attr({
      headerText: {
        text: 'Header',
      },
      bodyText: {
        text: 'test',
      },
    });
    rectangle.addTo(graph);
    // graph.addCells([rectangle]);
    let attribute;
    for (let i = 0; i < numAttr; i++) {
      attribute = new joint.shapes.devs.Atomic();
      attribute.resize(100, 20);
      attribute.position(50, 20 * (i + 2));
      attribute.attr({
        label: {
          text: 'Attribute' + (i + 1).toString(),
        },
        body: {
          fill: 'white',
        },
      });
      rectangle.embed(attribute);
      // graph.addCells([attribute]);
      attribute.addTo(graph);
    }
    return rectangle;
  }
}
