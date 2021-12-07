import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NormalizeComponent } from './normalize.component';

import { DatabaseService } from 'src/app/database.service';
import { exampleTable } from 'src/model/schema/exampleTables';
import { NormalizeSchemaGraphComponent } from 'src/app/components/normalize-schema-graph/normalize-schema-graph.component';
import { NormalizeSideBarComponent } from 'src/app/components/normalize-side-bar/normalize-side-bar.component';
import { By } from '@angular/platform-browser';
import Table from 'src/model/schema/Table';

describe('NormalizeComponent', () => {
  let component: NormalizeComponent;
  let fixture: ComponentFixture<NormalizeComponent>;
  let databaseServiceStub: any;

  beforeEach(async () => {
    databaseServiceStub = {
      inputTable: exampleTable(),
    };
    await TestBed.configureTestingModule({
      declarations: [
        NormalizeComponent,
        NormalizeSchemaGraphComponent,
        NormalizeSideBarComponent,
      ],
      imports: [RouterTestingModule, HttpClientModule],
      providers: [{ provide: DatabaseService, useValue: databaseServiceStub }],
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

  it('should have a normalize-schema-graph', () => {
    const schemaGraph = getSchemaGraph(fixture);
    expect(schemaGraph).toBeTruthy();
  });

  it("'s normalize-schema-graph should have correct tables", () => {
    const schemaGraph = getSchemaGraph(fixture);
    expect(schemaGraph.tables).toEqual(component.schema.tables);
    let table = new Table();
    component.schema.tables.add(table);
    expect(schemaGraph.tables).toEqual(component.schema.tables);
    component.schema.tables.delete(table);
    expect(schemaGraph.tables).toEqual(component.schema.tables);
  });

  it("'s normalize-schema-graph should have correct selected table", () => {
    const schemaGraph = getSchemaGraph(fixture);
    let table = [...component.schema.tables][0];
    component.onSelect(table);
    fixture.detectChanges();
    expect(schemaGraph.selectedTable).toEqual(component.selectedTable);
  });

  it("'s normalize-schema-graph should set selected table", () => {
    const schemaGraph = getSchemaGraph(fixture);
    let table = [...component.schema.tables][0];
    schemaGraph.selected.emit(table);
    expect(component.selectedTable).toEqual(table);
  });

  it('should have a normalize-side-bar when a table is selected', () => {
    const sideBar = getSideBar(fixture, component);
    expect(sideBar).toBeTruthy();
  });

  it("'s normalize-side-bar should have correct table", () => {
    const sideBar = getSideBar(fixture, component);
    expect(sideBar.table).toEqual(component.selectedTable!);
  });

  it("'s normalize-side-bar should trigger splitting", () => {
    const sideBar = getSideBar(fixture, component);
    let table = sideBar.table;
    sideBar.splitFd.emit(table.violatingFds()[0]);
    expect(component.schema.tables).not.toContain(table);
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

function getSchemaGraph(
  fixture: ComponentFixture<NormalizeComponent>
): NormalizeSchemaGraphComponent {
  return fixture.debugElement.query(By.directive(NormalizeSchemaGraphComponent))
    .componentInstance;
}

function getSideBar(
  fixture: ComponentFixture<NormalizeComponent>,
  component: NormalizeComponent
): NormalizeSideBarComponent {
  let table = [...component.schema.tables][0];
  component.onSelect(table);
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(NormalizeSideBarComponent))
    .componentInstance;
}
