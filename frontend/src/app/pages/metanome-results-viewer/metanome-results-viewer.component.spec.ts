import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetanomeResultsViewerComponent } from './metanome-results-viewer.component';

describe('MetanomeResultsViewerComponent', () => {
  let component: MetanomeResultsViewerComponent;
  let fixture: ComponentFixture<MetanomeResultsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetanomeResultsViewerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetanomeResultsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
