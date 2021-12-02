import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeSchemaGraphComponent } from './normalize-schema-graph.component';

describe('NormalizeSchemaGraphComponent', () => {
  let component: NormalizeSchemaGraphComponent;
  let fixture: ComponentFixture<NormalizeSchemaGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NormalizeSchemaGraphComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizeSchemaGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
