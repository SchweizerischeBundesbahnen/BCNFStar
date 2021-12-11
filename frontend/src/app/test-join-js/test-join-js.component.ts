import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as joint from 'jointjs';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-test-join-js',
  templateUrl: './test-join-js.component.html',
  styleUrls: ['./test-join-js.component.css'],
})
export class TestJoinJsComponent implements OnInit {
  public graphStorage: Record<
    string,
    {
      jointjsEl: joint.dia.Element;
      table: Table;
      style: Record<string, any>;
      links: Record<string, joint.dia.Link>;
    }
  > = {};
  constructor() {}
  @Input() tables!: Array<Table>;
  @ViewChild('paper') paperHtmlObject!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.createDefaultGraph();
  }

  createDefaultGraph() {
    let graph = new joint.dia.Graph();

    let paper = new joint.dia.Paper({
      el: document.getElementById('paper') || undefined,
      model: graph,
      width: 1000,
      height: 1000,
      gridSize: 1,
      drawGrid: true,
      background: {
        color: 'rgba(0, 255, 0, 0.3)',
      },
    });
    graph.on('change:position', (element) => {
      if (element.isElement) this.updateBBox(element);
    });

    // generate elements
    for (const table of this.tables) {
      const jointjsEl = new joint.shapes.standard.Rectangle();
      jointjsEl.attr({
        body: {
          strokeWidth: 0,
        },
      });
      jointjsEl.resize(300, 50 + 21 * table.columns.columns.size);
      jointjsEl.position(50, 10);

      this.graphStorage[table.name] = {
        // alternative to HtmlElement: joint.shapes.html.Element
        jointjsEl,
        style: {},
        table,
        links: {},
      };
      graph.addCell(jointjsEl);
      // TODO: find nicer way
      setTimeout(() => {
        this.updateBBox(jointjsEl);
      }, 100);
    }

    // generate links
    for (const table of this.tables) {
      for (const otherTable of table.referencedTables) {
        this.graphStorage[table.name].links[otherTable.name] =
          new joint.dia.Link({
            source: { id: this.graphStorage[table.name].jointjsEl.id },
            target: { id: this.graphStorage[otherTable.name].jointjsEl.id },
          });
      }
      graph.addCells(Object.values(this.graphStorage[table.name].links));
    }

    // var link = new joint.dia.Link({
    //   source: { id: rect.id },
    //   target: { id: rect2.id },
    // });

    paper.on('element:pointerup', function () {
      // alert('Hello')
    });
    // graph.addCells([rect, rect2, link]);
  }

  get paperOffset() {
    const { top, left } =
      this.paperHtmlObject.nativeElement.getBoundingClientRect();
    return { top, left };
  }

  updateBBox(element: joint.dia.Element) {
    for (const item of Object.values(this.graphStorage)) {
      if (item.jointjsEl == element) {
        const bbox = item.jointjsEl.getBBox();
        item.style = {
          width: bbox.width + 'px',
          height: bbox.height + 'px',
          left: bbox.x + this.paperOffset.left + 'px',
          top: bbox.y + this.paperOffset.top + 'px ',
          // transform: 'rotate(' + (this.get('angle') || 0) + 'deg)'
        };
        break;
      }
    }
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
