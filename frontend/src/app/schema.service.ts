import { EventEmitter, Injectable } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';
import IRowCounts from '@server/definitions/IRowCounts';
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
import UnionCommand from '../model/commands/UnionCommand';
import BasicTable from '../model/schema/BasicTable';
import Column from '../model/schema/Column';
import ColumnCombination from '../model/schema/ColumnCombination';
import FunctionalDependency from '../model/schema/FunctionalDependency';
import Schema from '../model/schema/Schema';
import SourceRelationship from '../model/schema/SourceRelationship';
import Table from '../model/schema/Table';
import TableRelationship from '../model/schema/TableRelationship';
import { DirectDimensionDialogComponent } from './components/operation-dialogs/direct-dimension-dialog/direct-dimension-dialog.component';
import { JoinDialogComponent } from './components/operation-dialogs/join-dialog/join-dialog.component';
import { DeleteTableDialogComponent } from './components/operation-dialogs/delete-table-dialog/delete-table-dialog.component';
import { unionSpec } from './components/union/union-sidebar/union-sidebar.component';
import { ViolatingRowsViewComponent } from './components/operation-dialogs/violating-rows-view/violating-rows-view.component';
import { ViolatingFDRowsDataQuery } from './dataquery';

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
  private _selectedTable?: BasicTable;
  public get selectedTable() {
    return this._selectedTable;
  }
  public set selectedTable(val: BasicTable | undefined) {
    this._selectedTable = val;
    this._selectedTableChanged.emit();
  }

  public hasSelectedRegularTable() {
    return !!this.selectedTable && this.selectedTable instanceof Table;
  }

  public highlightedColumns?: Map<BasicTable, ColumnCombination>;

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

  constructor(
    private dialog: SbbDialog,
    private notification: SbbNotificationToast
  ) {}

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
      this.selectedTable = fk.referencingTable;
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
    const value = await firstValueFrom(dialogRef.afterClosed());
    if (!value) return;
    const command = new DeleteTableCommand(
      this.schema,
      this._selectedTable! as Table
    );
    command.onDo = () => {
      this.selectedTable = undefined;
    };
    command.onUndo = () => {
      this.selectedTable = command.table;
    };
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public split(fd: FunctionalDependency, name?: string) {
    if (!(this.selectedTable instanceof Table))
      throw Error('splitting not implemented for unioned tables');

    let command = new SplitCommand(this._schema, this.selectedTable!, fd, name);

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
    if (!(this.selectedTable instanceof Table))
      throw Error('deleteColumn not implemented for unioned tables');
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
    selectedTables: Iterable<Table> = this._schema.regularTables
  ): void {
    let command = new AutoNormalizeCommand(this._schema, ...selectedTables);
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

  public union(spec: unionSpec) {
    const command = new UnionCommand(
      this.schema,
      spec.tables,
      spec.columns,
      spec.newTableName
    );
    command.onDo = () => (this.selectedTable = command.newTable);
    command.onUndo = () => (this.selectedTable = command.tables[0]);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public async makeDirectDimension(table: BasicTable): Promise<void> {
    if (!(table instanceof Table))
      throw Error('directDimension not implemented for unioned tables');

    let routes = this._schema.directDimensionableRoutes(table, true);
    if (routes.length !== 1) {
      const dialogRef = this.dialog.open(DirectDimensionDialogComponent, {
        data: { table: table },
      });

      const result = await firstValueFrom(dialogRef.afterClosed());
      routes = result.routes;
      if (!routes) return;
    }

    const command = new DirectDimensionCommand(this._schema, routes);
    command.onDo = () => (this.selectedTable = command.newTables[0]);
    command.onUndo = () => (this.selectedTable = command.oldTables[0]);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  /**
   * Checks the existance of a fd inside a table. It shows the violations inside a dialog.
   * @returns whether the fd is valid
   */
  public async checkFd(
    table: Table,
    fd: FunctionalDependency
  ): Promise<boolean> {
    // only check those columns, which are not defined by existing fds
    const dataQuery: ViolatingFDRowsDataQuery =
      await ViolatingFDRowsDataQuery.Create(
        table,
        fd.lhs.asArray(),
        fd.rhs.copy().setMinus(table.hull(fd.lhs)).asArray()
      );

    const rowCount: IRowCounts | void = await dataQuery
      .loadRowCount()
      .catch((e) => {
        console.error(e);
      });

    if (!rowCount) {
      const error_message =
        'There was a backend error while checking this IND. Check the browser and server logs for details';
      this.notification.open(error_message, { type: 'error' });
      throw new Error(error_message);
    }

    if (rowCount.entries != 0) {
      this.dialog.open(ViolatingRowsViewComponent, {
        data: {
          dataService: dataQuery,
          rowCount: rowCount,
        },
      });
    }

    return rowCount.entries == 0;
  }

  public setSurrogateKey(key: string) {
    if (!(this.selectedTable instanceof Table))
      throw Error('surrogate keys not implemented for unioned tables');
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
