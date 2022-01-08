import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TableSelectionComponent } from './table-selection.component';

import { DatabaseService } from 'src/app/database.service';
import { exampleTableSportartVerein } from 'src/model/schema/exampleTables';
import { Observable, Subject } from 'rxjs';
import Table from 'src/model/schema/Table';

describe('TableSelectionComponent', () => {
  let component: TableSelectionComponent;
  let fixture: ComponentFixture<TableSelectionComponent>;
  let databaseServiceStub: any;
  let loadTableCallback1 = new Subject<Array<Table>>();
  let loadTableCallback1$: Observable<Array<Table>> =
    loadTableCallback1.asObservable();

  beforeEach(async () => {
    databaseServiceStub = {
      loadTableCallback$: loadTableCallback1$,
      loadTables: () => {
        loadTableCallback1.next([exampleTableSportartVerein()]);
      },
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

    expect([...component.tables.keys()]).toEqual([
      exampleTableSportartVerein(),
    ]);
    [exampleTableSportartVerein()].forEach((table) => {
      expect(tableSelectionElement.innerHTML).toContain(table.name);
    });
  });
});
