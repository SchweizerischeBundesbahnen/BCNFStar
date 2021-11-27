import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import mermaid from 'mermaid';
import { SchemaService } from 'src/app/schema.service';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-normalize-schema-graph',
  templateUrl: './normalize-schema-graph.component.html',
  styleUrls: ['./normalize-schema-graph.component.css'],
})
export class NormalizeSchemaGraphComponent implements AfterViewInit {
  @ViewChild('mermaidDiv')
  mermaidDiv?: ElementRef;

  constructor(private schemaService: SchemaService) {}

  ngAfterViewInit(): void {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'forest',
    });
    if (this.mermaidDiv) {
      const element: HTMLDivElement = this.mermaidDiv.nativeElement;
      const graphDefinition =
        this.schemaService.inputTable!.allResultingTablesToMermaidString();
      mermaid.render('graphDiv', graphDefinition, (svgCode, bindFunctions) => {
        element.innerHTML = svgCode;
        this.schemaService.inputTable!.allResultingTables().forEach((table) => {
          document
            .querySelector(`[id^='classid-${table.name}']`)
            ?.addEventListener('click', () => {
              this.schemaService.selectedTable = table;
              console.log('clicked', table.name);
            });
          document
            .querySelector(`[id^='classid-${table.name}']`)
            ?.childNodes.item(2)
            .remove();
        });
      });
    }
  }
}
