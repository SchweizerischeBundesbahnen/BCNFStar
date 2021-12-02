import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeComponent } from './normalize.component';

import { SchemaService } from 'src/app/schema.service';
import { exampleTable } from 'src/model/schema/exampleTables';

describe('NormalizeComponent', () => {
  let component: NormalizeComponent;
  let fixture: ComponentFixture<NormalizeComponent>;
  let schemaServiceStub: any;

  beforeEach(async () => {
    schemaServiceStub = {
      inputTable: exampleTable(),
    };
    await TestBed.configureTestingModule({
      declarations: [NormalizeComponent],
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

  it('should have a normalize-schema-graph', () => {
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
  });

  it('should include the input table in tables', () => {
    expect(component.tables).toContain(component.inputTable);
  });

  it('should not include input table after a split', () => {
    component.onSelect(component.inputTable);
    component.onSplitFd(component.inputTable.fds[0]);
    expect(component.tables).not.toContain(component.inputTable);
  });
});
