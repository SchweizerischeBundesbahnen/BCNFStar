import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
import CommandProcessor from 'src/model/commands/CommandProcessor';
import SplitCommand from 'src/model/commands/SplitCommand';
import AutoNormalizeCommand from '@/src/model/commands/AutoNormalizeCommand';
import { BehaviorSubject } from 'rxjs';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { SplitDialogComponent } from '../../components/split-dialog/split-dialog.component';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  public readonly schema!: Schema;
  public readonly commandProcessor = new CommandProcessor();
  public selectedTable?: Table;
  public tablesEventEmitter: BehaviorSubject<Set<Table>> = new BehaviorSubject(
    new Set<Table>()
  );

  constructor(
    public dataService: DatabaseService,
    // eslint-disable-next-line no-unused-vars
    public dialog: SbbDialog
  ) {
    let inputTables = dataService.inputTables!;
    this.schema = new Schema(...inputTables);
    this.tablesEventEmitter.next(this.schema.tables);
  }

  onSelect(table: Table): void {
    this.selectedTable = table;
  }

  onClickSplit(fd: FunctionalDependency): void {
    const dialogRef = this.dialog.open(SplitDialogComponent, {
      data: fd,
    });

    dialogRef.afterClosed().subscribe((fd) => {
      if (fd) this.onSplitFd(fd);
    });
  }

  onSplitFd(fd: FunctionalDependency): void {
    let command = new SplitCommand(this.schema, this.selectedTable!, fd);

    // WARNING: When using arrow functions like here, `this` refers to
    // the context where the function is defined, instead of the function
    // object itself like when using function(){}
    command.onDo = () => (this.selectedTable = command.children![0]);
    command.onUndo = () => (this.selectedTable = command.table);
    this.commandProcessor.do(command);
    this.tablesEventEmitter.next(this.schema.tables);
  }

  onAutoNormalize(): void {
    let tables = this.selectedTable
      ? new Array(this.selectedTable)
      : new Array(...this.schema.tables);
    let command = new AutoNormalizeCommand(this.schema, ...tables);
    let self = this;
    let previousSelectedTable = this.selectedTable;
    command.onDo = function () {
      self.selectedTable = undefined;
    };
    command.onUndo = function () {
      self.selectedTable = previousSelectedTable;
    };
    this.commandProcessor.do(command);
    console.log('pushing');
    this.tablesEventEmitter.next(this.schema.tables);
  }

  onUndo() {
    this.commandProcessor.undo();
    this.tablesEventEmitter.next(this.schema.tables);
  }

  onRedo() {
    this.commandProcessor.redo();
    this.tablesEventEmitter.next(this.schema.tables);
  }
}
