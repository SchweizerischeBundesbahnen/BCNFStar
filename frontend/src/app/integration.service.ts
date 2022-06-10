import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Schema from '../model/schema/Schema';
import ISchemaMatchingRequest from '@server/definitions/ISchemaMatchingRequest';
import ISchemaMatchingResponse from '@server/definitions/ISchemaMatchingResponse';
import { DatabaseService } from './database.service';
import { SchemaService } from './schema.service';

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  private baseUrl: string;
  private _newSchema: Schema = new Schema();
  public get newSchema() {
    return this._newSchema;
  }
  private _existingSchema: Schema = new Schema();
  public get existingSchema() {
    return this._existingSchema;
  }
  private _isIntegrating = false;
  public get isIntegrating() {
    return this._isIntegrating;
  }

  constructor(
    private http: HttpClient,
    private schemaService: SchemaService,
    dataService: DatabaseService
  ) {
    this.baseUrl = dataService.baseUrl;
  }

  public startIntegration(newSchema: Schema, existingSchema: Schema) {
    this._newSchema = newSchema;
    this._existingSchema = existingSchema;
    this._isIntegrating = true;
    const combinedSchema = new Schema();
    for (const partSchema of [this._newSchema, this._existingSchema]) {
      combinedSchema.addTables(...partSchema.tables);
    }
    this.schemaService.setSchema(combinedSchema);
  }

  public getIniti2alMatching() {
    const body: ISchemaMatchingRequest = {
      src: [...this.newSchema.tables].map((t) => t.fullName),
      target: [...this.existingSchema.tables].map((t) => t.fullName),
    };
    return firstValueFrom(
      this.http.post<Array<ISchemaMatchingResponse>>(
        this.baseUrl + '/schemaMatching',
        body
      )
    );
  }
}
