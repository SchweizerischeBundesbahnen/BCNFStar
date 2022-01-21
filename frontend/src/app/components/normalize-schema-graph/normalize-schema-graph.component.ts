import {
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
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
export class NormalizeSchemaGraphComponent implements AfterViewInit, DoCheck {
  @ViewChild('mermaidDiv') mermaidDiv?: ElementRef;
  @Input() tables!: Set<Table>;
  @Input() selection?: Table;
  @Output() selectionChange = new EventEmitter<Table>();

  constructor() {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'forest',
    });
  }

  private changeSelection(table: Table) {
    this.selection = table;
    this.selectionChange.emit(this.selection);
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

  ngDoCheck(): void {
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
          this.changeSelection(table);
        });
        this.getTableinMermaid(table).childNodes.item(2).remove();
      });
      if (this.selection && this.tables.has(this.selection)) {
        (
          this.getTableinMermaid(this.selection).children.item(0)! as SVGElement
        ).style.strokeWidth = '3px';
      }
    }
  }

  private getTableinMermaid(table: Table): Element {
    return document.querySelector(`[id^='classid-${table.mermaidName}']`)!;
  }
}
