import { Component, OnInit } from '@angular/core';
import { exampleTable } from 'src/model/schema/experiments';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent {
  constructor() {}

  tables = [exampleTable()];
}
