import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseSelectionComponent } from './database-selection.component';

describe('DatabaseSelectionComponent', () => {
  let component: DatabaseSelectionComponent;
  let fixture: ComponentFixture<DatabaseSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatabaseSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
