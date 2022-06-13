import PostgreSQLPersisting from '@/src/model/schema/persisting/PostgreSQLPersisting';
import SQLPersisting from '@/src/model/schema/persisting/SQLPersisting';
import MsSqlPersisting from '@/src/model/schema/persisting/MsSqlPersisting';
import Schema from '@/src/model/schema/Schema';
import { Component, Input } from '@angular/core';
import * as saveAs from 'file-saver';
import { DatabaseService } from '../../../database.service';

@Component({
  selector: 'app-persist-schema',
  templateUrl: './persist-schema.component.html',
  styleUrls: ['./persist-schema.component.css'],
})
export class PersistSchemaComponent {
  @Input() public schema!: Schema;
  public schemaName: string = '';

  constructor(public dataService: DatabaseService) {}

  public async initPersisting(): Promise<SQLPersisting> {
    const dbmsName: string = await this.dataService.getDmbsName();

    if (dbmsName == 'postgres') {
      return new PostgreSQLPersisting(this.schemaName);
    } else if (dbmsName == 'mssql') {
      return new MsSqlPersisting(this.schemaName);
    }
    throw Error('Unknown Dbms-Server');
  }

  public async persistSchema(): Promise<string> {
    const persisting = await this.initPersisting();
    return persisting!.createSQL(this.schema);
  }

  async download(): Promise<void> {
    const file: File = new File(
      [await this.persistSchema()],
      this.schemaName.toLowerCase() + '.sql',
      {
        type: 'text/plain;charset=utf-8',
      }
    );
    saveAs(file);
  }
}
