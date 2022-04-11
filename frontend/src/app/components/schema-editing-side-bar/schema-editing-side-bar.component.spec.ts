import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaProcessingSideBarComponent } from './schema-editing-side-bar.component';

import { exampleTable } from 'src/model/schema/exampleTables';

describe('SchemaProcessingSideBarComponent', () => {
  let component: SchemaProcessingSideBarComponent;
  let fixture: ComponentFixture<SchemaProcessingSideBarComponent>;
  let htmlElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SchemaProcessingSideBarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaProcessingSideBarComponent);
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
