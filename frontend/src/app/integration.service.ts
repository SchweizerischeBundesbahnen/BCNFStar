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

  private getMatching(
    src: Array<BasicTable> = [...this.schemaService.schema.tables],
    target: Array<BasicTable> = [...(this.existingSchema?.tables ?? [])]
  ) {
    const srcPersister = new MsSqlPersisting('__schema_matching_temp_src');
    const targetPersister = new MsSqlPersisting(
      '__schema_matching_temp_target'
    );
    const body: ISchemaMatchingRequest = {
      srcSql: srcPersister.tableCreation(this.schemaService.schema, src, true),
      targetSql: targetPersister.tableCreation(
        this.existingSchema!,
        target,
        true
      ),
    };
    return firstValueFrom(
      this.http.post<Array<ISchemaMatchingResponse>>(
        this.baseUrl + '/schemaMatching',
        body
      )
    );
  }

  private async reset() {
    this.tables = [];
    this.schemaService.schema.tables.forEach((t) => this.tables.push(t));
    this.existingSchema?.tables.forEach((t) => this.tables.push(t));
    await this.generateLinks();
    this._existingSchemaChanged.emit();
  }

  private async getMatchingsFromBackend() {
    const matchings: Record<string, string[]> = {};
    const result = await this.getMatching();
    for (const entry of result) {
      if (!matchings[entry.source]) matchings[entry.source] = [];
      matchings[entry.source].push(entry.target);
    }
    return matchings;
  }

  private async generateLinks() {
    if (!this.matchings) this.matchings = await this.getMatchingsFromBackend();
    const newLinks: Array<LinkDefinition> = [];
    for (const table of this.schemaService.schema.regularTables)
      for (const column of table.columns) {
        const sourceIdent = `${column.sourceColumn.table.fullName}.${column.sourceColumn.name}`;
        if (!this.matchings[sourceIdent]) continue;
        for (const target of this.matchings[sourceIdent])
          for (const existingTable of this.existingSchema!.regularTables)
            for (const existingColumn of existingTable.columns) {
              const sC = existingColumn.sourceColumn;
              const existingSourceIdent = `${sC.table.fullName}.${sC.name}`;
              if (target === existingSourceIdent) {
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
            }
      }
    this.links = newLinks;
  }
}
