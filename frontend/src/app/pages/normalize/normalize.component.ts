import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
import CommandProcessor from 'src/model/commands/CommandProcessor';
import SplitCommand from 'src/model/commands/SplitCommand';
import AutoNormalizeCommand from '@/src/model/commands/AutoNormalizeCommand';
import Relationship from '@/src/model/schema/Relationship';
import { BehaviorSubject } from 'rxjs';
import JoinCommand from '@/src/model/commands/JoinCommand';
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
    this.schema = dataService.inputSchema!;
    this.tablesEventEmitter.next(this.schema.tables);
  }

  onSelect(table: Table): void {
    this.selectedTable = table;
  }

  onJoin(joinRelationship: [Relationship, Table]): void {
    let command = new JoinCommand(
      this.schema,
      this.selectedTable!,
      joinRelationship[1],
      joinRelationship[0]
    );

    let self = this;
    command.onDo = function () {
      self.selectedTable = undefined;
    };
    command.onUndo = function () {
      self.selectedTable = undefined;
    };
    this.commandProcessor.do(command);
  }

  onClickSplit(fd: FunctionalDependency): void {
    const dialogRef = this.dialog.open(SplitDialogComponent, {
      data: fd,
    });

    dialogRef.afterClosed().subscribe((fd: FunctionalDependency) => {
      if (fd) this.onSplitFd(fd);
    });
  }

  onSplitFd(fd: FunctionalDependency): void {
    let command = new SplitCommand(this.schema, this.selectedTable!, fd);
    // WARNING: To reference the command object from inside the function we need to define
    // the function via function(){}. If we used arrow functions ()=>{} 'this' would still
    // refer to this normalize component. We assign self to this, to keep a reference of this
    // component anyway.
    let self = this;
    command.onDo = function () {
      self.selectedTable = this.children![0];
    };
    command.onUndo = function () {
      self.selectedTable = this.table;
    };
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
