import { Component, OnInit } from '@angular/core';
import * as joint from 'jointjs';
import { MyShape } from './table_element';

@Component({
  selector: 'app-test-join-js',
  templateUrl: './test-join-js.component.html',
  styleUrls: ['./test-join-js.component.css'],
})
export class TestJoinJsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.createDefaultGraph();
  }

  createDefaultGraph() {
    let graph = new joint.dia.Graph();

    let paper = new joint.dia.Paper({
      el: document.getElementById('paper') || undefined,
      width: 600,
      height: 600,
      model: graph,
      gridSize: 1,
      drawGrid: true,
      background: {
        color: 'rgba(0, 255, 0, 0.3)',
      },
    });

    // let rect = this.createTableBox(graph, 2);
    let rect = new MyShape().setText('Hello');
    let rect2 = this.createTableBox(graph, 3);
    rect2.translate(300);

    var link = new joint.dia.Link({
      source: { id: rect.id },
      target: { id: rect2.id },
    });

    paper.on('element:pointerup', function () {
      // alert('Hello')
    });

    graph.addCells([rect, rect2, link]);
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
