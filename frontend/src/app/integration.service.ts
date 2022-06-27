import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Schema from '../model/schema/Schema';
import ISchemaMatchingRequest from '@server/definitions/ISchemaMatchingRequest';
import ISchemaMatchingResponse from '@server/definitions/ISchemaMatchingResponse';
import { DatabaseService } from './database.service';
import { SchemaService } from './schema.service';
import MsSqlPersisting from '../model/schema/persisting/MsSqlPersisting';
import BasicTable from '../model/schema/BasicTable';
import {
  LinkDefinition,
  PortSide,
} from './components/graph/schema-graph/schema-graph.component';
import Table from '../model/schema/Table';
import Column from '../model/schema/Column';
import SourceColumn from '../model/schema/SourceColumn';

export enum Side {
  left,
  right,
}

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  private baseUrl: string;

  public isComparing = true;

  private _schemas?: [Schema, Schema];
  private _currentlyEditedSide: Side = Side.left;
  set currentlyEditedSide(side: Side) {
    this._currentlyEditedSide = side;
    this.schemaService.schema = this._schemas![this._currentlyEditedSide];
    // reset selected table if it doesn't make sense anymore
    if (!this.schemaService.selectedTable) return;
    if (this.isComparing) return;
    if (this.schemaService.schema.tables.has(this.schemaService.selectedTable))
      return;
    this.schemaService.selectedTable = undefined;
  }
  get currentlyEditedSide() {
    return this._currentlyEditedSide;
  }

  get schemas() {
    return this._schemas;
  }

  /** schema that is currently not edited (the other ome is schemaService.schema)*/
  get inactiveSchema() {
    return this._schemas![this.currentlyEditedSide];
  }

  private _isIntegrating = false;
  get isIntegrating() {
    return !!this._isIntegrating;
  }

  /** <schema.table.column of left schema, schema.table.column of right schema*/
  private matchings?: Map<SourceColumn, SourceColumn>;

  public get tables() {
    if (!this.schemas) return [];
    return [...this.schemas[Side.left].tables].concat([
      ...this.schemas[Side.right].tables,
    ]);
  }
  /**
   * @returns joitnjs links representing the matching
   * between the current schemas
   * ready to be used in the schema graph
   */
  public get links() {
    if (!this.matchings || !this._schemas) return [];
    const newLinks: Array<LinkDefinition> = [];
    this.forMatch(
      this.matchings,
      this._schemas[Side.left].regularTables,
      this._schemas[Side.right].regularTables,
      (column, existingColumn, table, existingTable) => {
        if (table !== existingTable)
          newLinks.push({
            source: {
              columnName: column.name,
              side: PortSide.Right,
              table,
            },
            target: {
              columnName: existingColumn.name,
              side: PortSide.Left,
              table: existingTable,
            },
          });
      }
    );

    return newLinks;
  }

  constructor(
    private http: HttpClient,
    private schemaService: SchemaService,
    dataService: DatabaseService
  ) {
    this.baseUrl = dataService.baseUrl;
  }

  public startIntegration(schemaLeft: Schema, schemaRight: Schema) {
    this._schemas = [schemaLeft, schemaRight];
    this._isIntegrating = true;
    this.schemaService.schema = this._schemas[this._currentlyEditedSide];
    this.getColumnMatching().then((result) => {
      this.matchings = result;
      this.schemaService.notifyAboutSchemaChanges();
    });
  }

  stopIntegration() {
    this._isIntegrating = false;
    this._currentlyEditedSide = Side.left;
  }

  /**
   *
   * @param src Tables that should be matched
   * @param target Tables that should be matched
   * @param srcSchema Corresponding schema object of these tables
   * @param targetSchema Corresponding schema object of these tables
   * @returns Schema matching according to COMA
   */
  public async getColumnMatching(
    src: Iterable<Table> = this._schemas![Side.left].regularTables,
    target: Iterable<Table> = this._schemas![Side.right].regularTables,
    srcSchema: Schema = this._schemas![Side.left],
    targetSchema: Schema = this._schemas![Side.right]
  ) {
    const result = await this.getSchemaMatching(
      srcSchema,
      src,
      targetSchema,
      target
    );
    const matchings: Map<SourceColumn, SourceColumn> = new Map();

    const findSourceColumn = (tables: Iterable<Table>, identifier: string) =>
      [...tables]
        .find((t) => identifier.startsWith(t.fullName + '.'))
        ?.columns.asArray()
        .find((c) => identifier.endsWith('.' + c.name))?.sourceColumn;
    for (const entry of result) {
      const leftColumn = findSourceColumn(src, entry.source);
      const rightColumn = findSourceColumn(target, entry.target);
      if (leftColumn && rightColumn) matchings.set(leftColumn, rightColumn);
    }
    return matchings;
  }

  public async getTableMatching(
    srcSchema: Schema,
    src: Iterable<Table>,
    targetSchema: Schema,
    target: Iterable<Table>
  ) {
    const result = await this.getSchemaMatching(
      srcSchema,
      src,
      targetSchema,
      target
    );
    const matchings: Map<Table, Table> = new Map();
    const findTable = (tables: Iterable<Table>, identifier: string) =>
      [...tables].find((t) => t.fullName === identifier);
    for (const entry of result) {
      const leftTable = findTable(src, entry.source);
      const rightTable = findTable(target, entry.target);
      if (leftTable && rightTable) matchings.set(leftTable, rightTable);
    }
    return matchings;
  }

  private async getSchemaMatching(
    srcSchema: Schema,
    src: Iterable<Table>,
    targetSchema: Schema,
    target: Iterable<Table>
  ) {
    const srcPersister = new MsSqlPersisting('__schema_matching_temp_src');
    const targetPersister = new MsSqlPersisting(
      '__schema_matching_temp_target'
    );
    const body: ISchemaMatchingRequest = {
      srcSql: srcPersister.tableCreation(srcSchema, src, true),
      targetSql: targetPersister.tableCreation(targetSchema, target, true),
    };
    const result = await firstValueFrom(
      this.http.post<Array<ISchemaMatchingResponse>>(
        this.baseUrl + '/schemaMatching',
        body
      )
    );
    return result;
  }

  /**
   * Executes code for every found matching with
   *
   * @param matchings from coma obtained by calling integrationService.getMatching
   * @param tablesLeft tables the matching should be applied to
   * @param tablesRight tables the matching should be applied to
   * @param cb a function that is called for every pair of columns where a matching exists
   */
  forMatch(
    matchings: Map<SourceColumn, SourceColumn>,
    tablesLeft: Iterable<Table>,
    tablesRight: Iterable<Table>,
    cb: (
      src: Column,
      target: Column,
      srcTable: Table,
      targetTable: Table
    ) => void
  ) {
    for (const table of tablesLeft)
      for (const column of table.columns) {
        if (!matchings.get(column.sourceColumn)) continue;
        for (const existingTable of tablesRight)
          for (const existingColumn of existingTable.columns) {
            if (
              existingColumn.sourceColumn === matchings.get(column.sourceColumn)
            ) {
              cb(column, existingColumn, table, existingTable);
            }
          }
      }
  }

  public isInLeftSchema(table: BasicTable) {
    return this._schemas && this._schemas[Side.left].tables.has(table);
  }
  public isInRightSchema(table: BasicTable) {
    return this._schemas && this._schemas[Side.right].tables.has(table);
  }

  /**
   * Can be used with [ngClass]="intService.getBackground(table)" to set an element's background according to
   * which schema it belongs to
   * @param table The table used as basis for coloring
   * @param otherClasses Other classes that shall be applied via ngClass
   */
  public getBackground(
    table: BasicTable | undefined = this.schemaService.selectedTable,
    otherClasses: Record<string, boolean> = {}
  ): Record<string, boolean> {
    if (!table) return otherClasses;
    return Object.assign(
      {
        'integration-left': this.isInLeftSchema(table),
        'integration-right': this.isInRightSchema(table),
      },
      otherClasses
    );
  }
}
