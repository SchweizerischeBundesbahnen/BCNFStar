import PostgreSQLPersisting from '@/src/model/schema/persisting/PostgreSQLPersisting';
import SQLPersisting from '@/src/model/schema/persisting/SQLPersisting';
import SqlServerPersisting from '@/src/model/schema/persisting/SqlServerPersisting';
import Schema from '@/src/model/schema/Schema';
import { Component, Input, OnInit } from '@angular/core';
import * as saveAs from 'file-saver';
import { DatabaseService } from '../../database.service';

@Component({
  selector: 'app-persist-schema',
  templateUrl: './persist-schema.component.html',
  styleUrls: ['./persist-schema.component.css'],
})
export class PersistSchemaComponent implements OnInit {
  @Input() public schema!: Schema;
  public schemaName: string = '';
  public persisting: SQLPersisting | undefined;

  async ngOnInit(): Promise<void> {
    this.persisting = await this.initPersisting();
  }

  constructor(public dataService: DatabaseService) {}

  public async initPersisting(): Promise<SQLPersisting> {
    const dbmsName: string = await this.dataService.getDmbsName();

    if (dbmsName == 'postgres') {
      return new PostgreSQLPersisting();
    } else if (dbmsName == 'mssql') {
      return new SqlServerPersisting();
    }
    throw Error('Unknown Dbms-Server');
  }

  public persistSchema(): string {
    this.schema.name = this.schemaName;
    this.schema.tables.forEach((table) => (table.schemaName = this.schemaName));
    return this.persisting!.createSQL(this.schema);
  }

  async download(): Promise<void> {
    const file: File = new File(
      [this.persistSchema()],
      this.schemaName + '.sql',
      {
        type: 'text/plain;charset=utf-8',
      }
    );
    saveAs(file);
  }
}
