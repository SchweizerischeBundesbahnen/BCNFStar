import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { TableSelectionComponent } from './table-selection.component';

import { DatabaseService } from 'src/app/database.service';
import { exampleITable } from 'src/model/schema/exampleTables';
import { Type } from '@angular/core';

describe('TableSelectionComponent', () => {
  let component: TableSelectionComponent;
  let fixture: ComponentFixture<TableSelectionComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TableSelectionComponent],
      imports: [HttpClientTestingModule],
      providers: [{ provide: DatabaseService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TableSelectionComponent);
    component = fixture.componentInstance;
    httpMock = fixture.debugElement.injector.get<HttpTestingController>(
      HttpTestingController as Type<HttpTestingController>
    );
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all tables', () => {
    const tableSelectionElement: HTMLElement = fixture.nativeElement;
    const req = httpMock.expectOne(
      `http://${window.location.hostname}:80/tables`
    );
    expect(req.request.method).toBe('GET');
    req.flush(exampleITable);
    expect(fixture.componentInstance.tables.length).toBe(exampleITable.length);
    exampleITable.forEach((table) => {
      expect(tableSelectionElement.innerHTML).toContain(table.name);
    });
  });
});
