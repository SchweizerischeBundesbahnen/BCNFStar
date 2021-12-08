import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { ApplicationRef, Component } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
import CommandProcessor from 'src/model/commands/CommandProcessor';
import SplitCommand from 'src/model/commands/SplitCommand';
// import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  schema: Schema;
  selectedTable?: Table;
  commandProcessor = new CommandProcessor();

  // eslint-disable-next-line no-unused-vars
  constructor(public dataService: DatabaseService, private ar: ApplicationRef) {
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
    let command = new SplitCommand(this.schema, this.selectedTable!, fd);
    let tables = this.commandProcessor.do(command);
    this.selectedTable = tables[0];
    console.log();
  }

  onUndo() {
    console.log(this.schema);
    this.commandProcessor.undo();
    // eslint-disable-next-line no-self-assign
    //this.schema.tables = new Set([...this.schema.tables]);
    //this.ar.tick();
    this.ar.tick();
    console.log(this.schema);
  }

  onRedo() {
    this.commandProcessor.redo();
  }
}
