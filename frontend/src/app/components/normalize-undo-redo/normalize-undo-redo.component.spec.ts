import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeUndoRedoComponent } from './normalize-undo-redo.component';

describe('NormalizeUndoRedoComponent', () => {
  let component: NormalizeUndoRedoComponent;
  let fixture: ComponentFixture<NormalizeUndoRedoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NormalizeUndoRedoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizeUndoRedoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
