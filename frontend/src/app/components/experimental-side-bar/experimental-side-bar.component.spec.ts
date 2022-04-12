import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentalSideBarComponent } from './experimental-side-bar.component';

describe('ExperimentalSideBarComponent', () => {
  let component: ExperimentalSideBarComponent;
  let fixture: ComponentFixture<ExperimentalSideBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExperimentalSideBarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentalSideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
