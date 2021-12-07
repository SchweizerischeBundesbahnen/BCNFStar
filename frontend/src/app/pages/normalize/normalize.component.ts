import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
// import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  schema!: Schema;
  selectedTable?: Table;

  constructor(public dataService: DatabaseService) {
    let inputTable: Table = dataService.inputTable!;
    this.schema = new Schema(inputTable);
    this.dataService
      .getFunctionalDependenciesByTable(inputTable)
      .subscribe((fd) =>
        inputTable.setFds(
          ...fd.functionalDependencies.map((fds) =>
            FunctionalDependency.fromString(inputTable, fds)
          )
        )
      );
  }

  onSelect(table: Table): void {
    this.selectedTable = table;
  }

  onSplitFd(fd: FunctionalDependency): void {
    let tables = this.schema.split(this.selectedTable!, fd);
    this.selectedTable = tables[0];
  }
}
