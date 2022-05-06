import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveSchemaEditingComponent } from './save-schema-editing.component';

describe('SaveSchemaEditingComponent', () => {
  let component: SaveSchemaEditingComponent;
  let fixture: ComponentFixture<SaveSchemaEditingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SaveSchemaEditingComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveSchemaEditingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
