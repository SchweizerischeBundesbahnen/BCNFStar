import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckIndComponent } from './check-ind.component';

describe('CheckIndComponent', () => {
  let component: CheckIndComponent;
  let fixture: ComponentFixture<CheckIndComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckIndComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckIndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
