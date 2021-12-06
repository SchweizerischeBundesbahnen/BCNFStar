import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeSideBarComponent } from './normalize-side-bar.component';

import { exampleTable } from 'src/model/schema/exampleTables';

describe('NormalizeSideBarComponent', () => {
  let component: NormalizeSideBarComponent;
  let fixture: ComponentFixture<NormalizeSideBarComponent>;
  let htmlElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NormalizeSideBarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizeSideBarComponent);
    component = fixture.componentInstance;
    component.table = exampleTable();
    fixture.detectChanges();
    htmlElement = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have table name as headline', () => {
    expect(htmlElement.innerHTML).toContain(exampleTable().name);
  });

  it('should display all keys', () => {
    exampleTable()
      .keys()
      .forEach((key) => {
        expect(htmlElement.innerHTML).toContain(key.toString());
      });
  });

  it('should display all violating fds', () => {
    exampleTable()
      .violatingFds()
      .forEach((fd) => {
        expect(htmlElement.innerHTML).toContain(
          fd.toString().replace('>', '&gt;')
        );
      });
  });
});
