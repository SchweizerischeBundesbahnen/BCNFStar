import { Component, Inject, OnInit } from '@angular/core';
import { SBB_DIALOG_DATA } from '@sbb-esta/angular/dialog';
import * as joint from 'jointjs';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
import panzoom from 'panzoom';

@Component({
  selector: 'app-matching-viewer',
  templateUrl: './matching-viewer.component.html',
  styleUrls: ['./matching-viewer.component.css'],
})
export class MatchingViewerComponent implements OnInit {
  constructor(
    // eslint-disable-next-line no-unused-vars
    @Inject(SBB_DIALOG_DATA)
    public data: {
      matching: Record<string, Record<string, number>>;
    }
  ) {}

  private generateGraph() {
    console.log(this.data.matching);
    const graph = new joint.dia.Graph();
    const cells: Record<string, joint.dia.Element> = {};
    const paper = new joint.dia.Paper({
      el: document.getElementById('matching-paper') || undefined,
      model: graph,
      height: '1000',
      width: '1000',
      background: {
        color: 'rgba(200, 200, 200, 0.3)',
      },
    });
    for (const [start, startObj] of Object.entries(this.data.matching)) {
      if (!cells[start]) cells[start] = this.basicRectangle(start, graph);
      for (const [end, similarity] of Object.entries(startObj)) {
        if (!cells[end]) cells[end] = this.basicRectangle(end, graph);
        var link = new joint.shapes.standard.Link({
          labels: [{ attrs: { text: { text: similarity.toString() } } }],
          source: cells[start],
          target: cells[end],
        });
        link.addTo(graph);
      }
    }
    console.log(
      joint.layout.DirectedGraph.layout(graph, {
        dagre,
        graphlib,
        nodeSep: 40,
        edgeSep: 80,
        rankDir: 'LR',
      })
    );

    panzoom(document.querySelector('#matching-paper svg') as SVGElement, {
      smoothScroll: false,
      controller: {
        getOwner() {
          return document.querySelector('#matching-paper') as HTMLElement;
        },
        applyTransform: (transform) => {
          paper.scale(transform.scale);
          paper.translate(transform.x, transform.y);
        },
      },
      beforeMouseDown: (evt: MouseEvent) => {
        if (!evt.target) return false;
        let element: HTMLElement | null = evt.target as HTMLElement;
        while (element !== null) {
          if (element.classList.contains('joint-cell')) return true;
          element = element.parentElement;
        }
        return false;
      },
    });
  }

  basicRectangle(text: string, graph: joint.dia.Graph) {
    var rect = new joint.shapes.standard.Rectangle();
    rect.resize(300, 40);
    rect.attr({
      body: {
        fill: 'blue',
      },
      label: {
        text,
        fill: 'white',
      },
    });
    rect.addTo(graph);
    return rect;
  }

  ngOnInit(): void {
    this.generateGraph();
  }
}
