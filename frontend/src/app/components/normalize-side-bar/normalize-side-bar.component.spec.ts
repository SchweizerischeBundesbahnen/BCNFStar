import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizeSideBarComponent } from './normalize-side-bar.component';

import { exampleTable } from 'src/model/schema/exampleTables';

describe('NormalizeSideBarComponent', () => {
  let component: NormalizeSideBarComponent;
  let fixture: ComponentFixture<NormalizeSideBarComponent>;

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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have table name as headline', () => {
    const sideBarElement: HTMLElement = fixture.nativeElement;
    expect(sideBarElement.innerHTML).toContain(exampleTable().name);
  });

  it('should display all keys', () => {
    const sideBarElement: HTMLElement = fixture.nativeElement;
    exampleTable()
      .keys()
      .forEach((key) => {
        expect(sideBarElement.innerHTML).toContain(key.toString());
      });
  });

  it('should display all violating fds', () => {
    const sideBarElement: HTMLElement = fixture.nativeElement;
    console.log(sideBarElement.innerHTML);
    exampleTable()
      .violatingFds()
      .forEach((fd) => {
        expect(sideBarElement.innerHTML).toContain(
          fd.toString().replace('>', '&gt;')
        );
      });
  });
});
