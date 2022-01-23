import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitDialogComponent } from './split-dialog.component';

describe('SplitDialogComponent', () => {
  let component: SplitDialogComponent;
  let fixture: ComponentFixture<SplitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SplitDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
