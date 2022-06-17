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

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  private baseUrl: string;
  public existingSchema?: Schema;

  constructor(
    private http: HttpClient,
    private schemaService: SchemaService,
    dataService: DatabaseService
  ) {
    this.baseUrl = dataService.baseUrl;
  }

  public getMatching(
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
}
