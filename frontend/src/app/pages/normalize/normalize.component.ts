import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  schema!: Schema;
  selectedTable?: Table;

  constructor(public dataService: DatabaseService) {
    let inputTable = dataService.inputTable!;
    this.schema = new Schema(inputTable);
  }

  onSelect(table: Table): void {
    this.selectedTable = table;
  }

  onSplitFd(fd: FunctionalDependency): void {
    let tables = this.schema.split(this.selectedTable!, fd);
    this.selectedTable = tables[0];
  }
}
