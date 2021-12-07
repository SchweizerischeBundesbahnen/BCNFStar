import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { TableSelectionComponent } from './table-selection.component';

import { SchemaService } from 'src/app/schema.service';
import { exampleTable } from 'src/model/schema/exampleTables';
import Table from 'src/model/schema/Table';

describe('TableSelectionComponent', () => {
  let component: TableSelectionComponent;
  let fixture: ComponentFixture<TableSelectionComponent>;
  let schemaServiceStub: any;

  beforeEach(async () => {
    schemaServiceStub = {
      allTables: () => [exampleTable()],
    };
    await TestBed.configureTestingModule({
      declarations: [TableSelectionComponent],
      imports: [HttpClientModule],
      providers: [{ provide: SchemaService, useValue: schemaServiceStub }],
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

  it('should display all tables', () => {
    const tableSelectionElement: HTMLElement = fixture.nativeElement;
    (schemaServiceStub.allTables() as Table[]).forEach((table) => {
      expect(tableSelectionElement.innerHTML).toContain(table.name);
    });
  });
});
