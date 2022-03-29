import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import * as saveAs from 'file-saver';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
import CommandProcessor from 'src/model/commands/CommandProcessor';
import SplitCommand from 'src/model/commands/SplitCommand';
import AutoNormalizeCommand from '@/src/model/commands/AutoNormalizeCommand';
import { Subject } from 'rxjs';
import JoinCommand from '@/src/model/commands/JoinCommand';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { SplitDialogComponent } from '../../components/split-dialog/split-dialog.component';
import IndToFkCommand from '@/src/model/commands/IndToFkCommand';
import Relationship from '@/src/model/schema/Relationship';
import { Router } from '@angular/router';
import ColumnCombination from '@/src/model/schema/ColumnCombination';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  public readonly schema!: Schema;
  public readonly commandProcessor = new CommandProcessor();
  public selectedTable?: Table;
  public schemaName: string = '';
  public sql: PersistSchemaSql = new PersistSchemaSql();
  public selectedColumns?: ColumnCombination;
  public schemaChanged: Subject<void> = new Subject();
  private dataService: DatabaseService;

  constructor(
    dataService: DatabaseService,
    // eslint-disable-next-line no-unused-vars
    public dialog: SbbDialog,
    public router: Router
  ) {
    this.schema = dataService.inputSchema!;
    if (!this.schema) router.navigate(['']);
    this.dataService = dataService;
    // this.schemaChanged.next();
  }

  onSelectColumns(columns: ColumnCombination) {
    this.selectedColumns = columns;
  }

  onJoin(event: {
    source: Table;
    target: Table;
    relationship: Relationship;
  }): void {
    let command = new JoinCommand(
      this.schema,
      event.target,
      event.source,
      event.relationship
    );

    command.onDo = () => {
      this.selectedTable = undefined;
    };
    command.onUndo = () => {
      this.selectedTable = undefined;
    };

    this.commandProcessor.do(command);
    this.schemaChanged.next();
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

    command.onDo = () => (this.selectedTable = command.children![0]);
    command.onUndo = () => (this.selectedTable = command.table);

    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  onIndToFk(event: any): void {
    let command = new IndToFkCommand(
      this.schema,
      event.relationship,
      event.source,
      event.target
    );

    this.commandProcessor.do(command);
    this.schemaChanged.next();
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
    this.schemaChanged.next();
  }

  onUndo() {
    this.commandProcessor.undo();
    this.schemaChanged.next();
  }

  onRedo() {
    this.commandProcessor.redo();
    this.schemaChanged.next();
  }

  onInputChange(value: Event): void {
    this.schemaName = (value.target! as HTMLInputElement).value;
    console.log(this.schemaName);
  }

  persistSchema(schemaName: string): void {
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
        .getDataTransferSql(table, table.columns.asArray())
        .then(
          (res) => (this.sql.dataTransferStatements += '\n' + res.sql + '\n')
        );
    });

    console.log('Requesting SQL-Generation (Primary Keys)');
    this.schema.tables.forEach((table) => {
      if (table.pk) {
        this.dataService
          .getPrimaryKeySql(
            table.schemaName,
            table.name,
            table.pk!.columnNames()
          )
          .then(
            (res) => (this.sql.primaryKeyConstraints += '\n' + res.sql + '\n')
          );
      }
    });

    console.log('Requesting SQL-Generation (Foreign Keys)');

    this.schema.tables.forEach((table) => {
      this.schema.fksOf(table).forEach((elem) => {
        this.dataService
          .getForeignKeySql(table, elem.relationship, elem.table)
          .then(
            (res) => (this.sql.foreignKeyConstraints += '\n' + res.sql + '\n')
          );
      });
    });

    console.log('Finished! ' + schemaName);
  }

  download(): void {
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
