import Table from '@/src/model/schema/Table';
import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-table-selection',
  templateUrl: './table-selection.component.html',
  styleUrls: ['./table-selection.component.css'],
})
export class TableSelectionComponent implements OnInit {
  public tables: Array<Table> = [];
  public selectedTables = new Map<Table, Boolean>();
  public isLoading = false;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private dataService: DatabaseService,
    private router: Router
  ) {
    this.router = router;
  }

  async ngOnInit(): Promise<void> {
    this.tables = await this.dataService.loadTables();
    this.tables.forEach((table) => this.selectedTables.set(table, false));
  }

  public hasSelectedTables(): boolean {
    return [...this.selectedTables.values()].some((bool) => bool);
  }

  public selectTables() {
    const tables = this.tables.filter((table) =>
      this.selectedTables.get(table)
    );
    this.isLoading = true;
    this.dataService.setInputTables(tables).then(() => {
      this.isLoading = false;
      this.router.navigate(['/edit-schema']);
    });
  }
}
