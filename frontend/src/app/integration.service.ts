import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Schema from '../model/schema/Schema';
import ISchemaMatchingRequest from '@server/definitions/ISchemaMatchingRequest';
import ISchemaMatchingResponse from '@server/definitions/ISchemaMatchingResponse';
import { DatabaseService } from './database.service';
import { SchemaService } from './schema.service';
import Table from '../model/schema/Table';

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  private baseUrl: string;
  private _existingSchema: Schema = new Schema();
  public set existingSchema(schema) {
    this._existingSchema = schema;
  }
  public get existingSchema() {
    return this._existingSchema;
  }

  constructor(
    private http: HttpClient,
    private schemaService: SchemaService,
    dataService: DatabaseService
  ) {
    this.baseUrl = dataService.baseUrl;
  }

  public getMatching(
    src: Array<Table> = [...this.schemaService.schema.tables],
    target: Array<Table> = [...this.existingSchema.tables]
  ) {
    const body: ISchemaMatchingRequest = {
      src: src.map((t) => t.fullName),
      target: target.map((t) => t.fullName),
    };
    return firstValueFrom(
      this.http.post<Array<ISchemaMatchingResponse>>(
        this.baseUrl + '/schemaMatching',
        body
      )
    );
  }
}
