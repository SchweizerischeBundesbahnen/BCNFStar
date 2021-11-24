import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeSideBarComponent } from './normalize-side-bar.component';

describe('NormalizeSideBarComponent', () => {
  let component: NormalizeSideBarComponent;
  let fixture: ComponentFixture<NormalizeSideBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NormalizeSideBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizeSideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
