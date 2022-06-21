import { EventEmitter, Injectable } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { firstValueFrom } from 'rxjs';
import AutoNormalizeCommand from '../model/commands/AutoNormalizeCommand';
import CommandProcessor from '../model/commands/CommandProcessor';
import DeleteColumnCommand from '../model/commands/DeleteColumnCommand';
import DirectDimensionCommand from '../model/commands/DirectDimensionCommand';
import DismissFkCommand from '../model/commands/DismissFkCommand';
import IndToFkCommand from '../model/commands/IndToFkCommand';
import JoinCommand from '../model/commands/JoinCommand';
import ShowFkCommand from '../model/commands/ShowFkCommand';
import SplitCommand from '../model/commands/SplitCommand';
import DeleteTableCommand from '../model/commands/DeleteTableCommand';
import Column from '../model/schema/Column';
import ColumnCombination from '../model/schema/ColumnCombination';
import FunctionalDependency from '../model/schema/FunctionalDependency';
import Schema from '../model/schema/Schema';
import SourceRelationship from '../model/schema/SourceRelationship';
import Table from '../model/schema/Table';
import TableRelationship from '../model/schema/TableRelationship';
import { DirectDimensionDialogComponent } from './components/operation-dialogs/direct-dimension-dialog/direct-dimension-dialog.component';
import { JoinDialogComponent } from './components/operation-dialogs/join-dialog/join-dialog.component';
import { SplitDialogComponent } from './components/operation-dialogs/split-dialog/split-dialog.component';
import { DeleteTableDialogComponent } from './components/operation-dialogs/delete-table-dialog/delete-table-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  private _schema: Schema = new Schema();
  public setSchema(schema: Schema) {
    this._schema = schema;
    this.hasSchema = true;
    this.notifyAboutSchemaChanges();
  }

  public get schema() {
    return this._schema;
  }

  public hasSchema = false;

  private _selectedTableChanged = new EventEmitter<void>();
  public get selectedTableChanged() {
    return this._selectedTableChanged.asObservable();
  }
  private _selectedTable?: Table;
  public get selectedTable() {
    return this._selectedTable;
  }
  public set selectedTable(val: Table | undefined) {
    this._selectedTable = val;
    this._selectedTableChanged.emit();
  }

  public highlightedColumns?: Map<Table, ColumnCombination>;

  public get starMode() {
    return this._schema.starMode;
  }
  public set starMode(val: boolean) {
    this._schema.starMode = val;
    this.notifyAboutSchemaChanges();
  }

  private commandProcessor = new CommandProcessor();

  private _schemaChanged = new EventEmitter<void>();
  get schemaChanged() {
    return this._schemaChanged.asObservable();
  }

  constructor(private dialog: SbbDialog) {}

  public async join(fk: TableRelationship) {
    const dialogRef = this.dialog.open(JoinDialogComponent, {
      data: { fk: fk },
    });

    const value: {
      duplicate: boolean;
      newTableName?: string;
      sourceName?: string;
    } = await firstValueFrom(dialogRef.afterClosed());
    if (!value) return;
    let command = new JoinCommand(
      this._schema,
      fk,
      value.duplicate,
      value.newTableName,
      value.sourceName
    );

    command.onDo = () => {
      this.selectedTable = command.newTable;
    };
    command.onUndo = () => {
      this.selectedTable = fk.referencing;
    };

    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public dismiss(fk: TableRelationship) {
    let command = new DismissFkCommand(this.schema, fk);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public show(fk: TableRelationship) {
    let command = new ShowFkCommand(this.schema, fk);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public async deleteTable() {
    const dialogRef = this.dialog.open(DeleteTableDialogComponent);
    const value: { table: Table } = await firstValueFrom(
      dialogRef.afterClosed()
    );
    if (!value) return;
    const command = new DeleteTableCommand(this.schema, this._selectedTable!);
    command.onDo = () => {
      this.selectedTable = undefined;
    };
    command.onUndo = () => {
      this.selectedTable = command.table;
    };
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public async split(fd: FunctionalDependency) {
    const dialogRef = this.dialog.open(SplitDialogComponent, {
      data: {
        fd: fd,
      },
    });

    const value: { fd: FunctionalDependency; name?: string } =
      await firstValueFrom(dialogRef.afterClosed());
    if (!value) return;

    let command = new SplitCommand(
      this._schema,
      this.selectedTable!,
      value.fd,
      value.name
    );

    command.onDo = () => (this.selectedTable = command.children![0]);
    command.onUndo = () => (this.selectedTable = command.table);

    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public indToFk(event: SourceRelationship) {
    let command = new IndToFkCommand(this._schema, event);

    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public deleteColumn(column: Column) {
    let command = new DeleteColumnCommand(
      this._schema,
      this.selectedTable!,
      column
    );
    command.onDo = () => (this.selectedTable = command.newTable!);
    command.onUndo = () => (this.selectedTable = command.table);

    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public autoNormalize(
    selectedTables: Set<Table> | Table = this._schema.tables
  ): void {
    const tablesToNormalize =
      selectedTables.constructor.name == 'Set'
        ? Array.from(selectedTables as Set<Table>)
        : [selectedTables as Table];
    let command = new AutoNormalizeCommand(this._schema, ...tablesToNormalize);
    let self = this;
    let previousSelectedTable = this.selectedTable;
    command.onDo = function () {
      self.selectedTable = undefined;
    };
    command.onUndo = function () {
      self.selectedTable = previousSelectedTable;
    };
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public async makeDirectDimension(table: Table): Promise<void> {
    const routes = this._schema.directDimensionableRoutes(table, true);
    if (routes.length !== 1) {
      const dialogRef = this.dialog.open(DirectDimensionDialogComponent, {
        data: { table: table },
      });

      const routes: Array<Array<TableRelationship>> = await firstValueFrom(
        dialogRef.afterClosed()
      );
      if (!routes) return;
    }

    const command = new DirectDimensionCommand(this._schema, routes);
    command.onDo = () => (this.selectedTable = command.newTables[0]);
    command.onUndo = () => (this.selectedTable = command.newTables[0]);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public setSurrogateKey(key: string) {
    this.selectedTable!.surrogateKey = key;
    this.notifyAboutSchemaChanges();
  }

  public canUndo() {
    return this.commandProcessor.canUndo();
  }

  public canRedo() {
    return this.commandProcessor.canRedo();
  }

  public undo() {
    this.commandProcessor.undo();
    this.notifyAboutSchemaChanges();
  }

  public redo() {
    this.commandProcessor.redo();
    this.notifyAboutSchemaChanges();
  }

  private notifyAboutSchemaChanges() {
    this._schemaChanged.next();
  }
}
