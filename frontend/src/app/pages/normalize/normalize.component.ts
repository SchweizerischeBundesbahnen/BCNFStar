import { Component } from '@angular/core';
import { SchemaService } from 'src/app/schema.service';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  inputTable: Table;
  tables: Array<Table> = [];
  selectedTable?: Table;

  constructor(public schemaService: SchemaService) {
    this.inputTable = schemaService.inputTable!;
    this.onInputTableChanged();
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
