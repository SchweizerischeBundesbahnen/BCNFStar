import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component, OnInit } from '@angular/core';
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
import { JoinDialogComponent } from '../../components/join-dialog/join-dialog.component';
import IndToFkCommand from '@/src/model/commands/IndToFkCommand';
import { Router } from '@angular/router';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import PostgreSQLPersisting from '@/src/model/schema/persisting/PostgreSQLPersisting';
import SqlServerPersisting from '@/src/model/schema/persisting/SqlServerPersisting';
import SQLPersisting from '@/src/model/schema/persisting/SQLPersisting';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import { DirectDimensionDialogComponent } from '../../components/direct-dimension-dialog/direct-dimension-dialog.component';
import DirectDimensionCommand from '@/src/model/commands/DirectDimensionCommand';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { SbbRadioChange } from '@sbb-esta/angular/radio-button';

@Component({
  selector: 'app-schema-editing',
  templateUrl: './schema-editing.component.html',
  styleUrls: ['./schema-editing.component.css'],
})
export class SchemaEditingComponent implements OnInit {
  public readonly schema!: Schema;
  public readonly commandProcessor = new CommandProcessor();
  public selectedTable?: Table;
  public schemaName: string = '';
  public selectedColumns?: Map<Table, ColumnCombination>;
  public schemaChanged: Subject<void> = new Subject();

  public persisting: SQLPersisting | undefined;

  constructor(
    public dataService: DatabaseService,
    // eslint-disable-next-line no-unused-vars
    public dialog: SbbDialog,
    public router: Router
  ) {
    this.schema = dataService.schema!;
    if (!this.schema) router.navigate(['']);
    // this.schemaChanged.next();
  }
  async ngOnInit(): Promise<void> {
    this.persisting = await this.initPersisting();
  }

  public onSelectColumns(columns: Map<Table, ColumnCombination>) {
    this.selectedColumns = columns;
  }

  public onClickJoin(fk: TableRelationship): void {
    const dialogRef = this.dialog.open(JoinDialogComponent, {
      data: { fk: fk, schema: this.schema },
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (value: {
          duplicate: boolean;
          newTableName?: string;
          sourceName?: string;
        }) => {
          if (value)
            this.onJoin(
              fk,
              value.duplicate,
              value.newTableName,
              value.sourceName
            );
        }
      );
  }

  public onJoin(
    fk: TableRelationship,
    duplicate: boolean,
    newName?: string,
    sourceName?: string
  ): void {
    let command = new JoinCommand(
      this.schema,
      fk,
      duplicate,
      newName,
      sourceName
    );

    command.onDo = () => {
      this.selectedTable = command.newTable;
    };
    command.onUndo = () => {
      this.selectedTable = fk.referencing;
    };

    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  public async onClickSplit(fd: FunctionalDependency) {
    const dialogRef = this.dialog.open(SplitDialogComponent, {
      data: {
        fd: fd,
        table: this.selectedTable!,
        schema: this.schema,
      },
    });

    const value: { fd: FunctionalDependency; name?: string } =
      await firstValueFrom(dialogRef.afterClosed());
    if (value) this.onSplitFd(value);
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

  public onIndToFk(event: SourceRelationship): void {
    let command = new IndToFkCommand(this.schema, event);

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

  public setStarMode(radioChange: SbbRadioChange) {
    this.schema.starMode = radioChange.value;
    this.schemaChanged.next();
  }

  public onClickMakeDirectDimension(table: Table): void {
    const dialogRef = this.dialog.open(DirectDimensionDialogComponent, {
      data: { table: table, schema: this.schema },
    });

    dialogRef
      .afterClosed()
      .subscribe((value: { route: Array<TableRelationship> }) => {
        if (value) this.onMakeDirectDimension(value.route);
      });
  }

  public onMakeDirectDimension(route: Array<TableRelationship>) {
    let command = new DirectDimensionCommand(this.schema, route);
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

  public async initPersisting(): Promise<SQLPersisting> {
    const dbmsName: string = await this.dataService.getDmbsName();

    if (dbmsName == 'postgres') {
      return new PostgreSQLPersisting();
    } else if (dbmsName == 'mssql') {
      return new SqlServerPersisting();
    }
    throw Error('Unknown Dbms-Server');
  }

  public persistSchema(): string {
    this.schema.name = this.schemaName;
    this.schema.tables.forEach((table) => (table.schemaName = this.schemaName));
    return this.persisting!.createSQL(this.schema);
  }

  async download(): Promise<void> {
    const file: File = new File(
      [this.persistSchema()],
      this.schemaName + '.sql',
      {
        type: 'text/plain;charset=utf-8',
      }
    );
    saveAs(file);
  }
}
