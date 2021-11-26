import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import mermaid from 'mermaid';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-normalize-schema-graph',
  templateUrl: './normalize-schema-graph.component.html',
  styleUrls: ['./normalize-schema-graph.component.css'],
})
export class NormalizeSchemaGraphComponent implements AfterViewInit {
  @Input() table!: Table;

  @ViewChild('mermaidDiv')
  mermaidDiv?: ElementRef;

  constructor() {}

  ngAfterViewInit(): void {
    console.log(this.table);
    mermaid.initialize({
      startOnLoad: false,
    });
    if (this.mermaidDiv) {
      const element: HTMLDivElement = this.mermaidDiv.nativeElement;
      const graphDefinition = this.table.allResultingTablesToMermaidString();
      mermaid.render('graphDiv', graphDefinition, (svgCode, bindFunctions) => {
        element.innerHTML = svgCode;
      });
    }
  }
}
