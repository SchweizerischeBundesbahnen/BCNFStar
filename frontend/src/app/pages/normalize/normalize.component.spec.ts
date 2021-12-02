import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeComponent } from './normalize.component';

describe('NormalizeComponent', () => {
  let component: NormalizeComponent;
  let fixture: ComponentFixture<NormalizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NormalizeComponent],
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
});
