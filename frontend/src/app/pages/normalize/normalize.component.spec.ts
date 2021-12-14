import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NormalizeComponent } from './normalize.component';

import { NormalizeSchemaGraphComponent } from 'src/app/components/normalize-schema-graph/normalize-schema-graph.component';
import { NormalizeSideBarComponent } from 'src/app/components/normalize-side-bar/normalize-side-bar.component';
import { By } from '@angular/platform-browser';

import { DatabaseService } from 'src/app/database.service';
import Table from 'src/model/schema/Table';

describe('NormalizeComponent', () => {
  let component: NormalizeComponent;
  let fixture: ComponentFixture<NormalizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NormalizeComponent,
        NormalizeSchemaGraphComponent,
        NormalizeSideBarComponent,
      ],
      imports: [RouterTestingModule, HttpClientModule],
      providers: [{ provide: DatabaseService }],
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
    const schemaGraph = getSchemaGraph(fixture);
    expect(schemaGraph).toBeTruthy();
  });

  it("'s normalize-schema-graph should have correct tables", () => {
    const schemaGraph = getSchemaGraph(fixture);
    expect(schemaGraph.tables).toEqual(component.tables);
    component.tables.push(new Table());
    expect(schemaGraph.tables).toEqual(component.tables);
    component.tables.pop();
    expect(schemaGraph.tables).toEqual(component.tables);
  });

  it("'s normalize-schema-graph should have correct selected table", () => {
    const schemaGraph = getSchemaGraph(fixture);
    component.onSelect(component.inputTable);
    fixture.detectChanges();
    expect(schemaGraph.selectedTable).toEqual(component.selectedTable);
  });

  it("'s normalize-schema-graph should set selected table", () => {
    const schemaGraph = getSchemaGraph(fixture);
    schemaGraph.selected.emit(schemaGraph.tables[0]);
    expect(component.selectedTable).toEqual(schemaGraph.tables[0]);
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
  component.onSelect(component.inputTable);
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(NormalizeSideBarComponent))
    .componentInstance;
}
