import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as mermaid from 'mermaid';

@Component({
  selector: 'app-normalize-schema-graph',
  templateUrl: './normalize-schema-graph.component.html',
  styleUrls: ['./normalize-schema-graph.component.css'],
})
export class NormalizeSchemaGraphComponent implements AfterViewInit {
  @ViewChild('mermaidDiv')
  mermaidDiv?: ElementRef;

  constructor() {}

  ngAfterViewInit(): void {
    console.log(this.mermaidDiv);
    mermaid.initialize({
      startOnLoad: false,
    });

    if (this.mermaidDiv) {
      const element: HTMLDivElement = this.mermaidDiv.nativeElement;
      const graphDefinition = `erDiagram
      CUSTOMER ||--o{ ORDER : places
      ORDER ||--|{ LINE-ITEM : contains
      CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`;
      mermaid.render('graphDiv', graphDefinition, (svgCode, bindFunctions) => {
        element.innerHTML = svgCode;
      });
    }
  }
}
