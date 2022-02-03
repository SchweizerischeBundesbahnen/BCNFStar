import Table from '@/src/model/schema/Table';
import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  public tables: Array<Table> = [];
  public form!: FormGroup;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private dataService: DatabaseService,
    // eslint-disable-next-line no-unused-vars
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({});
  }

  ngOnInit(): void {
    let rec: Record<string, boolean> = {};

    this.dataService.loadTableCallback$.subscribe((data) => {
      this.tables = data;
      this.tables.map((table) => (rec[table.name] = false));
      this.form = this.formBuilder.group(rec);
    });
    this.dataService.loadTables();
  }

  public hasSelectedTables(): boolean {
    for (let tableName of Object.keys(this.form.controls)) {
      const control = this.form.controls[tableName];
      if (control.value) return true;
    }
    return false;
  }

  public selectTables() {
    this.dataService.setInputTables(
      this.tables.filter((table) => this.form.controls[table.name].value)
    );
  }
}
