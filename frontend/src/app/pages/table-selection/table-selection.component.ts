import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  tables = ['table_1', 'table_2', 'table_3', 'table_4', 'table_5'];
}
