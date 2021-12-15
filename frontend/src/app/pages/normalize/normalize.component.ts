import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
// import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  inputTable: Table;
  tables: Array<Table> = [];
  selectedTable?: Table;

  constructor(public dataService: DatabaseService) {
    this.inputTable = dataService.inputTable!;
    this.onInputTableChanged();
    console.log(this.inputTable);
  }

  onInputTableChanged(): void {
    this.tables = this.inputTable.allResultingTables();
  }

  onSelect(table: Table): void {
    this.selectedTable = table;
  }

  onSplitFd(fd: FunctionalDependency): void {
    this.selectedTable!.split(fd);
    this.onInputTableChanged();
    this.selectedTable = this.selectedTable!.children[0];
  }
}
