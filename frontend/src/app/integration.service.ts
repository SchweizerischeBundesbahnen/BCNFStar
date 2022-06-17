import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  private baseUrl: string;

  private updater?: Subscription;

  private _existingSchemaChanged = new EventEmitter<void>();
  get existingSchemaChanged() {
    return this._existingSchemaChanged.asObservable();
  }

  private _existingSchema?: Schema;
  get existingSchema() {
    return this._existingSchema;
  }
  set existingSchema(schema: Schema | undefined) {
    if (!this.updater) {
      this.updater = this.schemaService.schemaChanged.subscribe(() =>
        this.reset()
      );
    }
    this._existingSchema = schema;
    this.reset();
    this._existingSchemaChanged.emit();
  }

  public links: Array<LinkDefinition> = [];
  public tables: Array<BasicTable> = [];

  // <newColumn, oldColumn>
  private matchings?: Record<string, string[]>;

  constructor(
    private http: HttpClient,
    private schemaService: SchemaService,
    dataService: DatabaseService
  ) {
    this.baseUrl = dataService.baseUrl;
  }

  public async getMatching(
    src: Array<BasicTable> = [...this.schemaService.schema.tables],
    target: Array<BasicTable> = [...(this.existingSchema?.tables ?? [])],
    srcSchema: Schema = this.schemaService.schema,
    targetSchema: Schema = this._existingSchema!
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
    const matchings: Record<string, string[]> = {};
    for (const entry of result) {
      if (!matchings[entry.source]) matchings[entry.source] = [];
      matchings[entry.source].push(entry.target);
    }
    return matchings;
  }

  private async reset() {
    this.tables = [];
    this.schemaService.schema.tables.forEach((t) => this.tables.push(t));
    this.existingSchema?.tables.forEach((t) => this.tables.push(t));
    await this.generateLinks();
    this._existingSchemaChanged.emit();
  }

  forMatch(
    matchings: Record<string, string[]>,
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
        const sourceIdent = `${column.sourceColumn.table.fullName}.${column.sourceColumn.name}`;
        if (!matchings[sourceIdent]) continue;
        for (const target of matchings[sourceIdent])
          for (const existingTable of tablesRight)
            for (const existingColumn of existingTable.columns) {
              const sC = existingColumn.sourceColumn;
              const existingSourceIdent = `${sC.table.fullName}.${sC.name}`;
              if (target === existingSourceIdent) {
                cb(column, existingColumn, table, existingTable);
              }
            }
      }
  }

  private async generateLinks() {
    if (!this.matchings) this.matchings = await this.getMatching();
    const newLinks: Array<LinkDefinition> = [];
    if (!this.existingSchema) return;
    this.forMatch(
      this.matchings,
      this.schemaService.schema.regularTables,
      this.existingSchema.regularTables,
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
}
