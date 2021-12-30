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
    this.dataService
      .getFunctionalDependenciesByTable(this.inputTable)
      .subscribe((fd) =>
        this.inputTable.setFds(
          ...fd.functionalDependencies.map((fds) =>
            FunctionalDependency.fromString(this.inputTable, fds)
          )
        )
      );
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

  persistSchema(schemaName: string): void {
    console.log('Creating Tables');
    this.tables.forEach((table) => {
      this.dataService.postCreateTable(schemaName, table, this.inputTable);
    });

    console.log('Creating Foreign Keys');
    console.log(
      this.tables.map(
        (table) =>
          'Tablle: ' +
          table.name +
          ' referenziert: ' +
          Array.from(new Set(table.referencedTables.map((table) => table.name)))
      )
    );

    for (let i = this.tables.length - 1; i >= 0; i--) {
      for (let j = 0; j < this.tables[i].referencedTables.length; j++) {
        console.log(
          'Tablle: ' +
            this.tables[i].name +
            ' referenziert: ' +
            this.tables[i].referencedTables[j].name
        );
        this.dataService.postForeignKey(
          this.tables[i],
          this.tables[i].referencedTables[j],
          schemaName
        );
      }
    }

    // this.tables.forEach(
    //   (referencingTable) => {
    //     referencingTable.referencedTables.forEach(
    //       (referencedTable) => {
    //         console.log("Tablle: " + referencingTable.name + " referenziert: " + referencedTable.name);
    //         this.dataService.postForeignKey(referencingTable, referencedTable, schemaName);
    //       }
    //     )
    //   }
    // );

    console.log('Finished!!' + schemaName);
  }
}
