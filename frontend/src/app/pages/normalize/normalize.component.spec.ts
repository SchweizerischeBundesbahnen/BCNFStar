import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NormalizeComponent } from './normalize.component';

describe('NormalizeComponent', () => {
  let component: NormalizeComponent;
  let fixture: ComponentFixture<NormalizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NormalizeComponent],
      imports: [RouterTestingModule, HttpClientModule],
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
