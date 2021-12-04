import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeComponent } from './normalize.component';

import { SchemaService } from 'src/app/schema.service';
import { exampleTable } from 'src/model/schema/exampleTables';
import { NormalizeSchemaGraphComponent } from 'src/app/components/normalize-schema-graph/normalize-schema-graph.component';
import { NormalizeSideBarComponent } from 'src/app/components/normalize-side-bar/normalize-side-bar.component';
import { By } from '@angular/platform-browser';
import Table from 'src/model/schema/Table';

describe('NormalizeComponent', () => {
  let component: NormalizeComponent;
  let fixture: ComponentFixture<NormalizeComponent>;
  let schemaServiceStub: any;

  beforeEach(async () => {
    schemaServiceStub = {
      inputTable: exampleTable(),
    };
    await TestBed.configureTestingModule({
      declarations: [
        NormalizeComponent,
        NormalizeSchemaGraphComponent,
        NormalizeSideBarComponent,
      ],
      providers: [{ provide: SchemaService, useValue: schemaServiceStub }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should include the input table in tables', () => {
    expect(component.tables).toContain(component.inputTable);
  });

  it('should not include input table after a split', () => {
    component.onSelect(component.inputTable);
    component.onSplitFd(component.inputTable.fds[0]);
    expect(component.tables).not.toContain(component.inputTable);
  });

  it('should have a normalize-schema-graph', () => {
    const schemaGraph = fixture.debugElement.query(
      By.directive(NormalizeSchemaGraphComponent)
    ).componentInstance;
    expect(schemaGraph).toBeTruthy();
  });

  it("'s normalize-schema-graph should have correct tables", () => {
    const schemaGraph = fixture.debugElement.query(
      By.directive(NormalizeSchemaGraphComponent)
    ).componentInstance;
    expect(schemaGraph.tables).toEqual(component.tables);
    component.tables.push(new Table());
    expect(schemaGraph.tables).toEqual(component.tables);
    component.tables.pop();
    expect(schemaGraph.tables).toEqual(component.tables);
  });

  it("'s normalize-schema-graph should have correct selected table", () => {
    const schemaGraph = fixture.debugElement.query(
      By.directive(NormalizeSchemaGraphComponent)
    ).componentInstance;
    component.onSelect(component.inputTable);
    fixture.detectChanges();
    expect(schemaGraph.selectedTable).toEqual(component.selectedTable);
  });

  it("'s normalize-schema-graph should set selected table", () => {
    const schemaGraph = fixture.debugElement.query(
      By.directive(NormalizeSchemaGraphComponent)
    ).componentInstance;
    schemaGraph.selected.emit(schemaGraph.tables[0]);
    expect(component.selectedTable).toEqual(schemaGraph.tables[0]);
  });

  it('should have a normalize-side-bar when a table is selected', () => {
    component.onSelect(component.inputTable);
    fixture.detectChanges();
    const sideBar = fixture.debugElement.query(
      By.directive(NormalizeSideBarComponent)
    ).componentInstance;
    expect(sideBar).toBeTruthy();
  });

  it("'s normalize-side-bar should have correct table", () => {
    component.onSelect(component.inputTable);
    fixture.detectChanges();
    const sideBar = fixture.debugElement.query(
      By.directive(NormalizeSideBarComponent)
    ).componentInstance;
    expect(sideBar.table).toEqual(component.selectedTable);
  });

  it("'s normalize-side-bar should trigger splitting", () => {
    component.onSelect(component.inputTable);
    fixture.detectChanges();
    const sideBar = fixture.debugElement.query(
      By.directive(NormalizeSideBarComponent)
    ).componentInstance;
    sideBar.splitFd.emit(sideBar.table.violatingFds()[0]);
    expect(component.tables.includes(component.inputTable)).toBeFalse();
  });

  /*it('should have a normalize-schema-graph', () => {
    const normalizeElement: HTMLElement = fixture.nativeElement;
    expect(
      normalizeElement.querySelector('app-normalize-schema-graph')
    ).toBeTruthy();
  });

  it('should have a normalize-side-bar when a table is selected', () => {
    component.onSelect(component.inputTable);
    fixture.detectChanges();
    const normalizeElement: HTMLElement = fixture.nativeElement;
    expect(
      normalizeElement.querySelector('app-normalize-side-bar')
    ).toBeTruthy();
  });*/
});
