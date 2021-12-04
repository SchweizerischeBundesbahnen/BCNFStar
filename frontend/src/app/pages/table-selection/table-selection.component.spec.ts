import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { TableSelectionComponent } from './table-selection.component';

describe('TableSelectionComponent', () => {
  let component: TableSelectionComponent;
  let fixture: ComponentFixture<TableSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TableSelectionComponent],
      imports: [HttpClientModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
