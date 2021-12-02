import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeComponent } from './normalize.component';

import Table from 'src/model/schema/Table';
import { SchemaService } from 'src/app/schema.service';

describe('NormalizeComponent', () => {
  let component: NormalizeComponent;
  let fixture: ComponentFixture<NormalizeComponent>;
  let schemaServiceStub: any;

  beforeEach(async () => {
    schemaServiceStub = {
      inputTable: Table.fromColumnNames('a', 'b'),
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

  it('should have a normalize-side-bar', () => {
    const normalizeElement: HTMLElement = fixture.nativeElement;
    expect(
      normalizeElement.querySelector('app-normalize-side-bar')
    ).toBeTruthy();
  });
});
