import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
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

  private updater?: Subscription;

  public isComparing = false;

  private _schemas?: [Schema, Schema];
  private _currentlyEditedSide: Side = Side.left;
  set currentlyEditedSide(side: Side) {
    this._currentlyEditedSide = side;
    this.schemaService.schema = this._schemas![this._currentlyEditedSide];
    this.schemaService.selectedTable = undefined;
  }
  get currentlyEditedSide() {
    return this._currentlyEditedSide;
  }

  /** schema that is currently not edited (the other ome is schemaService.schema)*/
  get inactiveSchema() {
    return this._schemas![this.currentlyEditedSide];
  }

  get isIntegrating() {
    return !!this._schemas;
  }

  public links: Array<LinkDefinition> = [];
  public tables: Array<BasicTable> = [];

  /** <schema.table.column of left schema, schema.table.column of right schema*/
  private matchings?: Map<SourceColumn, SourceColumn>;

  constructor(
    private http: HttpClient,
    private schemaService: SchemaService,
    dataService: DatabaseService
  ) {
    this.baseUrl = dataService.baseUrl;
  }

  public startIntegration(schemaLeft: Schema, schemaRight: Schema) {
    this._schemas = [schemaLeft, schemaRight];
    if (!this.updater) {
      this.updater = this.schemaService.schemaChanged.subscribe(() =>
        this.generateGraphContent()
      );
    }
    this.schemaService.schema = this._schemas[this._currentlyEditedSide];
  }

  stopIntegration() {
    delete this.updater;
    this._schemas = undefined;
    this._currentlyEditedSide = Side.left;
  }

  public async getMatching(
    src: Iterable<Table> = this._schemas![Side.left].regularTables,
    target: Iterable<Table> = this._schemas![Side.right].regularTables,
    srcSchema: Schema = this._schemas![Side.left],
    targetSchema: Schema = this._schemas![Side.right]
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
    const matchings: Map<SourceColumn, SourceColumn> = new Map();
    const srcSourceColumns = [...src]
      .map((t) => t.columns.asArray().map((c) => c.sourceColumn))
      .flat();
    const targetSourceColumns = [...target]
      .map((t) => t.columns.asArray().map((c) => c.sourceColumn))
      .flat();
    for (const entry of result) {
      matchings.set(
        srcSourceColumns.find(
          (sc) => `${sc.table.fullName}.${sc.name}` === entry.source
        )!,
        targetSourceColumns.find(
          (sc) => `${sc.table.fullName}.${sc.name}` === entry.target
        )!
      );
    }
    return matchings;
  }

  private async generateGraphContent() {
    this.tables = [];
    this._schemas![Side.left].tables.forEach((t) => this.tables.push(t));
    this._schemas![Side.right].tables.forEach((t) => this.tables.push(t));
    await this.generateLinks();
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

  /**
   * Fills this.links with links representing the matching
   * between the current schemas
   * ready to be used in the schema graph
   */
  private async generateLinks() {
    if (!this.matchings) this.matchings = await this.getMatching();
    const newLinks: Array<LinkDefinition> = [];
    this.forMatch(
      this.matchings,
      this._schemas![Side.left].regularTables,
      this._schemas![Side.right].regularTables,
      (column, existingColumn, table, existingTable) => {
        newLinks.push({
          source: {
            columnName: column.sourceColumn.name,
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

    this.links = newLinks;
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
    console.log(
      Object.assign(
        {
          'integration-left': this.isInLeftSchema(table),
          'integration-right': this.isInRightSchema(table),
        },
        otherClasses
      )
    );
    return Object.assign(
      {
        'integration-left': this.isInLeftSchema(table),
        'integration-right': this.isInRightSchema(table),
      },
      otherClasses
    );
  }
}
