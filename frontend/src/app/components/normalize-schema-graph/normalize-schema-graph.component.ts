import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import mermaid from 'mermaid';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-normalize-schema-graph',
  templateUrl: './normalize-schema-graph.component.html',
  styleUrls: ['./normalize-schema-graph.component.css'],
})
export class NormalizeSchemaGraphComponent implements AfterViewInit, OnChanges {
  @ViewChild('mermaidDiv') mermaidDiv?: ElementRef;
  @Input() tables!: Array<Table>;
  @Input() selectedTable?: Table;
  @Output() selected = new EventEmitter<Table>();

  constructor() {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'forest',
    });
  }

  private mermaidString(): string {
    let result = 'classDiagram\n';
    this.tables.forEach((table) => {
      result = result.concat(table.toMermaidString(), '\n');
    });
    return result;
  }

  ngAfterViewInit(): void {
    this.renderMermaid();
  }

  ngOnChanges(): void {
    this.renderMermaid();
  }

  renderMermaid(): void {
    if (this.mermaidDiv) {
      const element: HTMLDivElement = this.mermaidDiv.nativeElement;
      const graphDefinition = this.mermaidString();
      mermaid.render('graphDiv', graphDefinition, (svgCode) => {
        element.innerHTML = svgCode;
      });
      this.tables.forEach((table) => {
        this.getTableinMermaid(table).addEventListener('click', () => {
          this.selected.emit(table);
        });
        this.getTableinMermaid(table).childNodes.item(2).remove();
      });
      if (this.selectedTable && this.tables.includes(this.selectedTable)) {
        (
          this.getTableinMermaid(this.selectedTable).children.item(
            0
          )! as SVGElement
        ).style.strokeWidth = '3px';
      }
    }
  }

  private getTableinMermaid(table: Table): Element {
    return document.querySelector(
      `[id^='classid-${table.name.replace(' ', '')}']`
    )!;
  }
}
