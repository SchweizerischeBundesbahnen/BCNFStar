import { ComponentFixture, TestBed } from '@angular/core/testing';
import { exampleTable } from 'src/model/schema/exampleTables';

import { NormalizeSchemaGraphComponent } from './normalize-schema-graph.component';

describe('NormalizeSchemaGraphComponent', () => {
  let component: NormalizeSchemaGraphComponent;
  let fixture: ComponentFixture<NormalizeSchemaGraphComponent>;
  // let htmlElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NormalizeSchemaGraphComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizeSchemaGraphComponent);
    component = fixture.componentInstance;
    component.tables = [exampleTable()];
    fixture.detectChanges();
    // htmlElement = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
