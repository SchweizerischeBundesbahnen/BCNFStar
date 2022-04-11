import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SchemaEditingComponent } from './schema-editing.component';

import { DatabaseService } from 'src/app/database.service';
import { exampleTable } from 'src/model/schema/exampleTables';
import { NormalizeSchemaGraphComponent } from '@/src/app/components/schema-graph/schema-graph.component';
import { SchemaProcessingSideBarComponent } from '@/src/app/components/schema-editing-side-bar/schema-editing-side-bar.component';
import { By } from '@angular/platform-browser';
import Table from 'src/model/schema/Table';

describe('SchemaEditingComponent', () => {
  let component: SchemaEditingComponent;
  let fixture: ComponentFixture<SchemaEditingComponent>;
  let databaseServiceStub: any;

  beforeEach(async () => {
    databaseServiceStub = {
      inputTable: exampleTable(),
    };
    await TestBed.configureTestingModule({
      declarations: [
        SchemaEditingComponent,
        NormalizeSchemaGraphComponent,
        SchemaProcessingSideBarComponent,
      ],
      imports: [RouterTestingModule, HttpClientModule],
      providers: [{ provide: DatabaseService, useValue: databaseServiceStub }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaEditingComponent);
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

  it('its normalize-schema-graph should have correct tables', () => {
    const schemaGraph = getSchemaGraph(fixture);
    expect(schemaGraph.tables).toEqual(component.schema.tables);
    let table = new Table();
    component.schema.tables.add(table);
    expect(schemaGraph.tables).toEqual(component.schema.tables);
    component.schema.tables.delete(table);
    expect(schemaGraph.tables).toEqual(component.schema.tables);
  });

  it('its normalize-schema-graph should have correct selected table', () => {
    const schemaGraph = getSchemaGraph(fixture);
    let table = [...component.schema.tables][0];
    component.onSelect(table);
    fixture.detectChanges();
    expect(schemaGraph.selectedTable).toEqual(component.selectedTable);
  });

  it('its normalize-schema-graph should set selected table', () => {
    const schemaGraph = getSchemaGraph(fixture);
    let table = [...component.schema.tables][0];
    schemaGraph.selected.emit(table);
    expect(component.selectedTable).toEqual(table);
  });

  it('should have a normalize-side-bar when a table is selected', () => {
    const sideBar = getSideBar(fixture, component);
    expect(sideBar).toBeTruthy();
  });

  it('its normalize-side-bar should have correct table', () => {
    const sideBar = getSideBar(fixture, component);
    expect(sideBar.table).toEqual(component.selectedTable!);
  });

  it('its normalize-side-bar should trigger splitting', () => {
    const sideBar = getSideBar(fixture, component);
    let table = sideBar.table!;
    sideBar.splitFd.emit(table.violatingFds()[0]);
    expect(component.schema.tables).not.toContain(table);
  });

  it('should have a normalize-schema-graph', () => {
    expect(getSchemaGraph(fixture)).toBeTruthy();
  });

  it('should have a normalize-side-bar when a table is selected', () => {
    expect(getSideBar(fixture, component)).toBeTruthy();
  });
});

function getSchemaGraph(
  fixture: ComponentFixture<SchemaEditingComponent>
): NormalizeSchemaGraphComponent {
  return fixture.debugElement.query(By.directive(NormalizeSchemaGraphComponent))
    .componentInstance;
}

function getSideBar(
  fixture: ComponentFixture<SchemaEditingComponent>,
  component: SchemaEditingComponent
): NormalizeSideBarComponent {
  let table = [...component.schema.tables][0];
  component.onSelect(table);
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(NormalizeSideBarComponent))
    .componentInstance;
}
