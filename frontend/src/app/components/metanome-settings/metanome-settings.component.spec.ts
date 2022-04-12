import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetanomeSettingsComponent } from './metanome-settings.component';

describe('MetanomeSettingsComponent', () => {
  let component: MetanomeSettingsComponent;
  let fixture: ComponentFixture<MetanomeSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetanomeSettingsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetanomeSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
