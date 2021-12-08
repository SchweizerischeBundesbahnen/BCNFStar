import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestJoinJsComponent } from './test-join-js.component';

describe('TestJoinJsComponent', () => {
  let component: TestJoinJsComponent;
  let fixture: ComponentFixture<TestJoinJsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestJoinJsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestJoinJsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
