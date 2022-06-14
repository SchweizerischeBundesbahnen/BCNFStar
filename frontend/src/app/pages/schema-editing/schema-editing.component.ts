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
import { SplitDialogComponent } from '../../components/operation-dialogs/split-dialog/split-dialog.component';
import { JoinDialogComponent } from '../../components/operation-dialogs/join-dialog/join-dialog.component';
import IndToFkCommand from '@/src/model/commands/IndToFkCommand';
import { Router } from '@angular/router';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import { DirectDimensionDialogComponent } from '../../components/direct-dimension-dialog/direct-dimension-dialog.component';
import DirectDimensionCommand from '@/src/model/commands/DirectDimensionCommand';
import TableRelationship from '@/src/model/schema/TableRelationship';
import Column from '@/src/model/schema/Column';
import DeleteColumnCommand from '@/src/model/commands/DeleteColumnCommand';
import { SchemaGraphComponent } from '../../components/graph/schema-graph/schema-graph.component';
import { SbbRadioChange } from '@sbb-esta/angular/radio-button';
import { SbbCheckboxChange } from '@sbb-esta/angular/checkbox';
import HideFkCommand from '@/src/model/commands/HideFkCommand';
import ShowFkCommand from '@/src/model/commands/ShowFkCommand';

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

  public onDeleteColumn(column: Column): void {
    let command = new DeleteColumnCommand(
      this.schema,
      this.selectedTable!,
      column
    );
    command.onDo = () => (this.selectedTable = command.newTable!);
    command.onUndo = () => (this.selectedTable = command.table);

    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  public onAutoNormalize(selectedTables: Set<Table> | Table): void {
    const tablesToNormalize =
      selectedTables.constructor.name == 'Set'
        ? Array.from(selectedTables as Set<Table>)
        : [selectedTables as Table];
    let command = new AutoNormalizeCommand(this.schema, ...tablesToNormalize);
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

  public setFkFiltering(checkboxChange: SbbCheckboxChange) {
    this.schema.shouldFilterFks = checkboxChange.checked;
    this.schemaChanged.next();
  }

  public onClickMakeDirectDimension(table: Table): void {
    const routes = this.schema.directDimensionableRoutes(table, true);
    if (routes.length == 1) {
      this.onMakeDirectDimensions(routes);
    } else {
      const dialogRef = this.dialog.open(DirectDimensionDialogComponent, {
        data: { table: table, schema: this.schema },
      });
      dialogRef
        .afterClosed()
        .subscribe((value: { routes: Array<Array<TableRelationship>> }) => {
          if (value) this.onMakeDirectDimensions(value.routes);
        });
    }
  }

  public onSetSurrogateKey(name: string) {
    this.selectedTable!.surrogateKey = name;
    this.schemaChanged.next();
  }

  public onMakeDirectDimensions(routes: Array<Array<TableRelationship>>) {
    const command = new DirectDimensionCommand(this.schema, routes);
    command.onDo = () => (this.selectedTable = command.newTables[0]);
    command.onUndo = () => (this.selectedTable = command.newTables[0]);
    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  public onClickHideFk(fk: TableRelationship) {
    let command = new HideFkCommand(this.schema, fk);

    this.commandProcessor.do(command);
    this.schemaChanged.next();
  }

  public onClickShowFk(fk: TableRelationship) {
    let command = new ShowFkCommand(this.schema, fk);

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
