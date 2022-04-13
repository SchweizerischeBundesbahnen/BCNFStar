import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
import * as saveAs from 'file-saver';
import { DatabaseService } from 'src/app/database.service';
import Schema from 'src/model/schema/Schema';
import CommandProcessor from 'src/model/commands/CommandProcessor';
import SplitCommand from 'src/model/commands/SplitCommand';
import AutoNormalizeCommand from '@/src/model/commands/AutoNormalizeCommand';
import { firstValueFrom, Subject } from 'rxjs';
import JoinCommand from '@/src/model/commands/JoinCommand';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { SplitDialogComponent } from '../../components/split-dialog/split-dialog.component';
import IndToFkCommand from '@/src/model/commands/IndToFkCommand';
import Relationship from '@/src/model/schema/Relationship';
import { Router } from '@angular/router';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import TableRenameCommand from '@/src/model/commands/TableRenameCommand';
import { TableRelationship } from '@/src/model/types/TableRelationship';

@Component({
  selector: 'app-schema-editing',
  templateUrl: './schema-editing.component.html',
  styleUrls: ['./schema-editing.component.css'],
})
export class SchemaEditingComponent {
  public readonly schema!: Schema;
  public readonly commandProcessor = new CommandProcessor();
  public selectedTable?: Table;
  public schemaName: string = '';
  public sql: PersistSchemaSql = new PersistSchemaSql();
  public selectedColumns?: Map<Table, ColumnCombination>;
  public schemaChanged: Subject<void> = new Subject();

  constructor(
    public dataService: DatabaseService,
    // eslint-disable-next-line no-unused-vars
    public dialog: SbbDialog,
    public router: Router
  ) {
    this.schema = dataService.inputSchema!;
    if (!this.schema) router.navigate(['']);
    // this.schemaChanged.next();
  }

  public onSelectColumns(columns: Map<Table, ColumnCombination>) {
    this.selectedColumns = columns;
  }

  public onJoin(event: {
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

  async onClickSplit(fd: FunctionalDependency) {
    const dialogRef = this.dialog.open(SplitDialogComponent, {
      data: fd,
    });

    const value: { fd: FunctionalDependency; name?: string } =
      await firstValueFrom(dialogRef.afterClosed());
    if (fd) this.onSplitFd(value);
  }

  public onSplitFd(value: { fd: FunctionalDependency; name?: string }): void {
    let command = new SplitCommand(
      this.schema,
      this.selectedTable!,
      value.fd,
      value.name
    );

    command.onDo = () => (this.selectedTable = command.children![0]);
    command.onUndo = () => (this.selectedTable = command.table);

    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  public onIndToFk(event: TableRelationship): void {
    let command = new IndToFkCommand(
      this.schema,
      event.relationship,
      event.referencing,
      event.referenced
    );

    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  public onAutoNormalize(): void {
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

  public onChangeTableName(value: { table: Table; newName: string }): void {
    let command = new TableRenameCommand(value.table, value.newName);

    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  public onUndo() {
    this.commandProcessor.undo();
    this.schemaChanged.next();
  }

  public onRedo() {
    this.commandProcessor.redo();
    this.schemaChanged.next();
  }

  public async persistSchema(): Promise<void> {
    this.schema.tables.forEach((table) => (table.schemaName = this.schemaName));

    const tables: Table[] = Array.from(this.schema.tables);

    console.log('Requesting SQL-Generation (Prepare Schema Statements)');
    const res = await this.dataService.getSchemaPreparationSql(
      this.schemaName,
      tables
    );
    this.sql.databasePreparation += '\n' + res.sql + '\n';

    console.log('Requesting SQL-Generation (Create Table Statements)');
    for (const table of this.schema.tables) {
      const createTableSql = await this.dataService.getCreateTableSql(table);
      this.sql.createTableStatements += '\n' + createTableSql.sql + '\n';
      const dataTransferSql = await this.dataService.getDataTransferSql(
        table,
        table.columns.asArray()
      );
      this.sql.dataTransferStatements += '\n' + dataTransferSql.sql + '\n';

      if (table.pk) {
        const pk = await this.dataService.getPrimaryKeySql(
          table.schemaName,
          table.name,
          table.pk!.columnNames()
        );
        this.sql.primaryKeyConstraints += '\n' + pk.sql + '\n';
      }

      for (const fk of this.schema.fksOf(table)) {
        const fkSql = await this.dataService.getForeignKeySql(
          fk.referencing,
          fk.relationship,
          fk.referenced
        );
        this.sql.foreignKeyConstraints += '\n' + fkSql.sql + '\n';
      }
    }

    console.log('Requesting SQL-Generation (Primary Keys)');

    console.log('Requesting SQL-Generation (Foreign Keys)');

    console.log('Finished! ' + this.schemaName);
  }

  async download(): Promise<void> {
    await this.persistSchema();
    const file: File = new File(
      [this.sql.to_string()],
      this.schemaName + '.sql',
      {
        type: 'text/plain;charset=utf-8',
      }
    );
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
