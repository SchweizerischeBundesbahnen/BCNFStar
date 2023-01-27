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
import { ViolatingRowsViewComponent } from './components/operation-dialogs/violating-rows-view/violating-rows-view.component';
import { ViolatingFDRowsDataQuery } from './dataquery';
import { DatabaseService } from './database.service';
import { DeleteTableDialogComponent } from './components/operation-dialogs/delete-table-dialog/delete-table-dialog.component';
import Command from '../model/commands/Command';
import SuggestFactCommand from '../model/commands/SuggestFactCommand';
import RejectFactCommand from '../model/commands/RejectFactCommand';

import { UnionDialogComponent } from './components/union/union-dialog/union-dialog.component';

/**
 * This service is the core of BCNFStar's schema editing (=normal) mode.
 * It manages the working schema. It supplies the schema and the selected table.
 * All changes to the schema should happen through this service, as it informs
 * components like the graph about these changes. To listen for schema changes,
 * subscribe to schemaChanged.
 * It also manages the command processor, which is used to undo and redo schema operations.
 */
@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  public hasSchema = false;
  private _schema: Schema = new Schema();
  public set schema(schema: Schema) {
    this._schema = schema;
    this.hasSchema = true;
    this.notifyAboutSchemaChanges();
  }
  public get schema() {
    return this._schema;
  }

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
    return this.schema.__starMode;
  }

  public set starMode(mode: boolean) {
    this.schema.__starMode = mode;
    this.notifyAboutSchemaChanges();
  }

  /** This command processor is used to enable undo/redo functionality for schema changes.
   * For more information on this pattern, see {@link https://refactoring.guru/design-patterns/command}.
   * A subset of its functionality is exposed through {@link undo}, {@link redo}, {@link canUndo} and {@link canRedo}
   */
  private commandProcessor = new CommandProcessor();

  private _schemaChanged = new EventEmitter<void>();
  /** Always emits an event after the schema has been replaced or modified */
  get schemaChanged() {
    return this._schemaChanged.asObservable();
  }

  constructor(
    private dialog: SbbDialog,
    private notification: SbbNotificationToast,
    private dataService: DatabaseService
  ) {}

  /**
   * Shows the join dialog to users for join options, and
   * executes the join if the user confirms the join in that dialog
   * @param fk TableRelationship to be joined
   */
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
    if (command.newTable)
      await this.resetDataForRedundanceRanking([command.newTable!]);
    this.notifyAboutSchemaChanges();
  }

  /** Hides a foreign key that the user doesn't want to be displayed and persisted */
  public dismiss(fk: TableRelationship) {
    let command = new DismissFkCommand(this.schema, fk);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  /** Displays a foreign key that was either blacklisted or filtered. This will cause it
   * to be created when persisting the schema. When a foreign key was on the blacklist, it
   * just gets removed from there and does not get put on the whitelist, so it may be filtered later.
   */
  public show(fk: TableRelationship) {
    let command = new ShowFkCommand(this.schema, fk);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  /** Shows a warning and deletes a table from the schema. If no table is given, deletes the selectedTable */
  public async deleteTable(table: BasicTable | undefined = this.selectedTable) {
    if (!table) return;
    const dialogRef = this.dialog.open(DeleteTableDialogComponent);
    const value = await firstValueFrom(dialogRef.afterClosed());
    if (!value) return;
    const command = new DeleteTableCommand(this.schema, table);
    command.onDo = () => {
      this.selectedTable = undefined;
    };
    command.onUndo = () => {
      this.selectedTable = command.table;
    };
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  /**
   * Splits the  {@link selectedTable} according to the given {@link FunctionalDependency}.
   * Normally, the split fd dialog should be shown before this operation for the user to customise
   * the FD to be split
   * @param fd FunctionalDependency used to split the table
   * @param name Name of the resulting table. By default: column names of the FD's left hand side.
   */
  public suggestOrRejectFact(table: BasicTable, suggest: boolean) {
    const command = suggest
      ? new SuggestFactCommand(this.schema, table)
      : new RejectFactCommand(this.schema, table);
    command.onDo = () => {
      this.selectedTable = table;
    };
    command.onUndo = () => {
      this.selectedTable = table;
    };
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  public async split(
    fd: FunctionalDependency,
    nullSubstitutes: Map<Column, string>,
    name?: string
  ) {
    if (!(this.selectedTable instanceof Table))
      throw Error('splitting not implemented for unioned tables');
    let command = new SplitCommand(
      this._schema,
      this.selectedTable!,
      fd,
      nullSubstitutes,
      name
    );

    command.onDo = () => (this.selectedTable = command.children![0]);
    command.onUndo = () => (this.selectedTable = command.table);

    this.commandProcessor.do(command);
    if (command.children?.length != 0) {
      await this.resetDataForRedundanceRanking(command.children!);
    }
    this.notifyAboutSchemaChanges();
  }

  /**
   * Creates a foreign key based on an inclusion dependency
   */
  public indToFk(ind: SourceRelationship) {
    let command = new IndToFkCommand(this._schema, ind);

    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  /** Deletes the specified column from the {@link selectedTable} */
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

  /**
   * @param selectedTables Tables for the algorithm to be executed on
   * Applies the BCNF algorithm to each of these tables:
   * As long as there are BCNF-violating {@link FunctionalDependency FunctionalDependencies}
   * for this table, split on the highest-rated of these FDs and do the same for the generated tables
   */
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

  /**
   * Opens the union dialog and executes the selected union
   * @param tables the pair of tables to be unioned
   */
  public async union(tables: [Table, Table]) {
    const dialogRef = this.dialog.open(UnionDialogComponent, {
      data: {
        tables,
      },
    });
    const dialogResult: {
      columns: Array<Array<Column | null>>;
      newTableName: string;
    } = await firstValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;
    const command = new UnionCommand(
      this.schema,
      tables,
      dialogResult.columns,
      dialogResult.newTableName
    );
    command.onDo = () => (this.selectedTable = command.newTable);
    command.onUndo = () => (this.selectedTable = command.tables[0]);
    this.commandProcessor.do(command);
    this.notifyAboutSchemaChanges();
  }

  /**
   * To be used while in Star Schema mode. Displays the DirectDimension dialog, and applies
   * the user's choice there.
   * DirectDimension can be applied to dimension tables which do not have a foreign key directly
   * linking them to the fact table. It adds the refencing columns of their foreign key to the fact
   * table to create a direct foreign key between the fact table and {@link table}
   */
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
        'There was a backend error while checking this FD. Check the browser and server logs for details';
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

  public async resetDataForRedundanceRanking(tables: Array<Table>) {
    let fdRedundantTuplePromises: Array<Promise<number>> = new Array<
      Promise<number>
    >();
    let fdUniqueTuplesLhsPromises: Array<Promise<number>> = new Array<
      Promise<number>
    >();

    if (
      (window as any).DEFAULT_RANKING_WEIGHTS.redundanceTeam > 0 ||
      (window as any).DEFAULT_RANKING_WEIGHTS.redundanceWeiLink > 0
    ) {
      tables.forEach((table) => {
        table.fdClusters().forEach((cluster) => {
          if ((window as any).DEFAULT_RANKING_WEIGHTS.redundanceTeam > 0) {
            fdUniqueTuplesLhsPromises.push(
              this.dataService.getUniqueTuplesOfValueCombinations(
                table,
                cluster.fds[0].lhs.asArray()
              )
            );
          }
          if ((window as any).DEFAULT_RANKING_WEIGHTS.redundanceWeiLink > 0) {
            fdRedundantTuplePromises.push(
              this.dataService.getRedundanceByValueCombinations(
                table,
                cluster.fds[0].lhs.asArray()
              )
            );
          }
        });
      });

      if ((window as any).DEFAULT_RANKING_WEIGHTS.redundanceTeam > 0) {
        let resultUniqueTuplesLhs = await Promise.all(
          fdUniqueTuplesLhsPromises
        );
        let num = 0;
        tables.forEach((table) => {
          table.fdClusters().forEach((cluster, index) =>
            cluster.fds.forEach((fd) => {
              fd._uniqueTuplesLhs = resultUniqueTuplesLhs[index + num];
            })
          );
          num += table.fdClusters().length;
        });
      }

      if ((window as any).DEFAULT_RANKING_WEIGHTS.redundanceWeiLink > 0) {
        let resultRedundantTuples = await Promise.all(fdRedundantTuplePromises);
        let num = 0;
        tables.forEach((table) => {
          table.fdClusters().forEach((cluster, index) =>
            cluster.fds.forEach((fd) => {
              fd._redundantTuples = resultRedundantTuples[index + num];
            })
          );
          num += table.fdClusters().length;
        });
      }
    }
  }

  /**
   * Submits a command to the command processor that does nothing except
   * calling the onDo and onUndo callbacks when appropriate
   * Currently used to change from and to different integration modes
   * @param onDo executed once immediately, and every time the user redos this action
   * @param onUndo executed every time the user undos this action
   */
  public doPlainCommand(onDo: () => void, onUndo: () => void) {
    const command = new Command();
    command.onDo = onDo;
    command.onUndo = onUndo;
    this.commandProcessor.do(command);
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

  public notifyAboutSchemaChanges() {
    this._schemaChanged.next();
  }
}
