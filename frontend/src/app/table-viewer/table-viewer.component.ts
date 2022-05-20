import Table from '@/src/model/schema/Table';
import { Component } from '@angular/core';
import { DatabaseService } from '../database.service';

@Component({
  selector: 'app-table-viewer',
  templateUrl: './table-viewer.component.html',
  styleUrls: ['./table-viewer.component.css'],
})
export class TableViewerComponent {
  public tables: Array<Table>;
  constructor(dataService: DatabaseService) {
    this.tables = [...dataService.schema!.tables];
  }
}
