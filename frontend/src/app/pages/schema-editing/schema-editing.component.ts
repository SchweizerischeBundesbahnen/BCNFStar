import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component, ViewChild } from '@angular/core';
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
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import TableRelationship from '@/src/model/schema/TableRelationship';
import { SchemaGraphComponent } from '../../components/schema-graph/schema-graph.component';

@Component({
  selector: 'app-schema-editing',
  templateUrl: './schema-editing.component.html',
  styleUrls: ['./schema-editing.component.css'],
})
export class SchemaEditingComponent {
  @ViewChild(SchemaGraphComponent, { static: true })
  public graph!: SchemaGraphComponent;
  public readonly schema!: Schema;
  public readonly commandProcessor = new CommandProcessor();
  public selectedTable?: Table;
  public selectedColumns?: Map<Table, ColumnCombination>;
  public schemaChanged: Subject<void> = new Subject();

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

  public onAutoNormalize(tableSelected: boolean = true): void {
    let tables = tableSelected
      ? new Array(this.selectedTable!)
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

  public onUndo() {
    this.commandProcessor.undo();
    this.schemaChanged.next();
  }

  public onRedo() {
    this.commandProcessor.redo();
    this.schemaChanged.next();
  }
}
