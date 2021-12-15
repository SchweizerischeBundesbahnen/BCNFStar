import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TableSelectionComponent } from './table-selection.component';

import { DatabaseService } from 'src/app/database.service';
import { exampleITable } from 'src/model/schema/exampleTables';
import { of } from 'rxjs';

describe('TableSelectionComponent', () => {
  let component: TableSelectionComponent;
  let fixture: ComponentFixture<TableSelectionComponent>;
  let databaseServiceStub: any;

  beforeEach(async () => {
    databaseServiceStub = {
      getTableNames: () => of(exampleITable),
    };
    await TestBed.configureTestingModule({
      declarations: [TableSelectionComponent],
      imports: [HttpClientTestingModule],
      providers: [{ provide: DatabaseService, useValue: databaseServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(TableSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all tables', () => {
    const tableSelectionElement: HTMLElement = fixture.nativeElement;

    expect(component.tables).toEqual(exampleITable);
    exampleITable.forEach((table) => {
      expect(tableSelectionElement.innerHTML).toContain(table.name);
    });
  });
});
