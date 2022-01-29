import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
import CommandProcessor from 'src/model/commands/CommandProcessor';
import SplitCommand from 'src/model/commands/SplitCommand';
import AutoNormalizeCommand from '@/src/model/commands/AutoNormalizeCommand';
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
  public sql: PersistSchemaSql = {
    foreignKeyConstraints: 'ForeignKey: ',
    databasePreparation: 'DatabasePreparation: ',
    createTableStatements: 'CreateTableStatements: ',
    dataTransferStatements: 'DataTransferStatements: ',
    primaryKeyConstraints: 'PrimaryKeyConstraints: ',
  };

  constructor(
    public dataService: DatabaseService,
    // eslint-disable-next-line no-unused-vars
    public dialog: SbbDialog
  ) {
    this.schema = dataService.inputSchema!;
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
  }

  onUndo() {
    this.commandProcessor.undo();
  }

  onRedo() {
    this.commandProcessor.redo();
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
      this.dataService
        .getDataTransferSql(
          table,
          table.columns.sourceTable(),
          Array.from(table.columns.columns)
        )
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
    this.schema.tables.forEach((referencingTable) => {
      referencingTable.referencedTables().forEach((referencedTable) => {
        this.dataService
          .getForeignKeySql(referencingTable, referencedTable)
          .then(
            (res) => (this.sql.foreignKeyConstraints += '\n' + res.sql + '\n')
          );
      });
    });

    console.log('Finished! ' + schemaName);
  }
}

interface PersistSchemaSql {
  databasePreparation?: string;
  createTableStatements?: string;
  dataTransferStatements?: string;
  primaryKeyConstraints?: string;
  foreignKeyConstraints?: string;
}
