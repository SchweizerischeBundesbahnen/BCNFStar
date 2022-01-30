import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import * as saveAs from 'file-saver';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
import CommandProcessor from 'src/model/commands/CommandProcessor';
import SplitCommand from 'src/model/commands/SplitCommand';
import AutoNormalizeCommand from '@/src/model/commands/AutoNormalizeCommand';
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
  public sql: PersistSchemaSql = new PersistSchemaSql();
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

  onJoin(event: any): void {
    let command = new JoinCommand(
      this.schema,
      event.target,
      event.source,
      event.relationship
    );

    let self = this;
    command.onDo = function () {
      self.selectedTable = undefined;
    };
    command.onUndo = function () {
      self.selectedTable = undefined;
    };
    this.commandProcessor.do(command);
    this.tablesEventEmitter.next(this.schema.tables);
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

  persistSchema(schemaName: string): void {
    console.log('Requesting SQL-Generation');

    this.schema.tables.forEach((table) => (table.schemaName = schemaName));

    const tables: Table[] = Array.from(this.schema.tables);

    console.log('Requesting SQL-Generation (Prepare Schema Statements)');
    this.dataService
      .getSchemaPreparationSql(schemaName, tables)
      .then((res) => (this.sql.databasePreparation += '\n' + res.sql + '\n'));

    console.log('Requesting SQL-Generation (Create Table Statements)');
    this.schema.tables.forEach((table) => {
      this.dataService
        .getCreateTableSql(table)
        .then(
          (res) => (this.sql.createTableStatements += '\n' + res.sql + '\n')
        );
    });

    console.log('Requesting SQL-Generation (Data Transfer)');
    this.schema.tables.forEach((table) => {
      console.log('source table: ', table.columns.sourceTable());
      this.dataService
        .getDataTransferSql(table, Array.from(table.columns.columns))
        .then(
          (res) => (this.sql.dataTransferStatements += '\n' + res.sql + '\n')
        );
    });

    console.log('Requesting SQL-Generation (Primary Keys)');
    this.schema.tables.forEach((table) => {
      this.dataService
        .getPrimaryKeySql(
          table.schemaName,
          table.name,
          table.keys()[0].columnNames()
        )
        .then(
          (res) => (this.sql.primaryKeyConstraints += '\n' + res.sql + '\n')
        );
    });

    console.log('Requesting SQL-Generation (Foreign Keys)');

    console.log(this.schema.fkRelationships);

    this.schema.tables.forEach((table) => {
      table.fks().forEach((elem) => {
        this.dataService
          .getForeignKeySql(table, elem[0], elem[1])
          .then(
            (res) => (this.sql.foreignKeyConstraints += '\n' + res.sql + '\n')
          );
      });
    });

    console.log('Finished! ' + schemaName);
  }

  download(): void {
    console.log('HERE');
    const file: File = new File([this.sql.to_string()], 'persist_schema.sql', {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(file);
  }
}

class PersistSchemaSql {
  public databasePreparation: string = '';
  public createTableStatements: string = '';
  public dataTransferStatements: string = '';
  public primaryKeyConstraints: string = '';
  public foreignKeyConstraints: string = '';
  public to_string(): string {
    return (
      '/* SCHEMA PREPARATION: */\n' +
      this.databasePreparation! +
      '\n' +
      '/* SCHEMA CREATION: */\n' +
      this.createTableStatements! +
      '\n' +
      '/* DATA TRANSER: */\n' +
      this.dataTransferStatements! +
      '\n' +
      '/* PRIMARY KEYS: */\n' +
      this.primaryKeyConstraints! +
      '\n' +
      '/* FOREIGN KEYS: */\n' +
      this.foreignKeyConstraints! +
      '\n'
    );
  }
}
