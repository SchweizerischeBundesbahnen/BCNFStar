import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import IFunctionalDependencies from '@server/definitions/IFunctionalDependencies';
import Table from '../model/schema/Table';
import { Observable, shareReplay, map, Subject } from 'rxjs';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import IFk from '@server/definitions/IFk';
import ColumnCombination from '../model/schema/ColumnCombination';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public inputTables?: Array<Table>;
  private loadTableCallback = new Subject<Array<Table>>(); // Source
  loadTableCallback$ = this.loadTableCallback.asObservable(); // Stream
  // when using the angular dev server, you need to access another adress
  // for the BCNFStar express server. It is assumed that this server is
  // at http://localhost:80. In production mode, the serving server is assumed
  // to be the BCNFStar express server (found in backend/index.ts)
  public baseUrl: string = isDevMode() ? 'http://localhost:80' : '';
  private fks: Array<IFk> = [];

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  public loadTables(): Array<Table> {
    let tables: Array<Table> = [];
    this.getTables().subscribe((data) => {
      tables.push(...data);
      this.getIFks().subscribe((data) => {
        this.fks = data;
        // this.resolveIFks(data, tables);
        this.loadTableCallback.next(tables);
      });
    });
    return tables;
  }

  private getTables(): Observable<Array<Table>> {
    let tableResult;
    if (!tableResult) {
      tableResult = this.http
        .get<ITable[]>(`${this.baseUrl}/tables`)
        // required for caching
        .pipe(shareReplay(1))
        .pipe(
          map((iTables: Array<ITable>) =>
            iTables.map((iTable) => Table.fromITable(iTable))
          )
        );
    }
    return tableResult;
  }

  private getIFks(): Observable<Array<IFk>> {
    let fks;
    fks = this.http
      .get<IFk[]>(`${this.baseUrl}/fks`)
      // required for caching
      .pipe(shareReplay(1));
    return fks;
  }

  private resolveIFks(fks: Array<IFk>, tables: Array<Table>) {
    fks.forEach((fk) => {
      let referencing_table: Table = tables.filter(
        (table) => fk.name == table.name
      )[0];
      let referenced_table: Table = tables.filter(
        (table) => fk.foreignName == table.name
      )[0];

      if (referencing_table && referenced_table) {
        referencing_table.referencedTables.add(referenced_table);
        referenced_table.referencingTables.add(referencing_table);

        let fk_column: ColumnCombination =
          referencing_table.columns.columnsFromNames(fk.column);
        let pk_column: ColumnCombination =
          referenced_table.columns.columnsFromNames(fk.foreignColumn);

        referencing_table.columns.setMinus(fk_column).union(pk_column);

        if (!referenced_table.pk) referenced_table.pk = new ColumnCombination();
        referenced_table.pk.union(pk_column);
      }
    });
  }

  public setInputTables(tables: Array<Table>) {
    this.inputTables = tables;
    this.inputTables.forEach((inputTable) => {
      this.getFunctionalDependenciesByTable(inputTable).subscribe((fd) =>
        inputTable.setFds(
          ...fd.functionalDependencies.map((fds) =>
            FunctionalDependency.fromString(inputTable, fds)
          )
        )
      );
    });
    this.resolveIFks(this.fks, this.inputTables);
  }

  protected fdResult: Record<string, Observable<IFunctionalDependencies>> = {};
  private getFunctionalDependenciesByTable(
    table: Table
  ): Observable<IFunctionalDependencies> {
    if (!this.fdResult[table.name])
      this.fdResult[table.name] = this.http
        .get<IFunctionalDependencies>(
          `${this.baseUrl}/tables/${table.name}/fds`
        )
        .pipe(shareReplay(1));
    return this.fdResult[table.name];
  }

  // {"sql" : "ALTER TABLE ADD FOREIGN KEY............. "}
  getForeignKeySql(
    referencingTable: Table,
    referencedTable: Table,
    schema: string
  ): Promise<any> {
    // TODO: Tabellen-Objekt sollte auch schema bekommen.... dann kann das hier weg...
    if (referencingTable.name.startsWith('public.')) {
      referencingTable.name = referencingTable.name.substring(7);
    }
    if (referencedTable.name.startsWith('public.')) {
      referencedTable.name = referencedTable.name.substring(7);
    }

    if (referencingTable.name.startsWith('dbo.')) {
      referencingTable.name = referencingTable.name.substring(4);
    }
    if (referencedTable.name.startsWith('dbo.')) {
      referencedTable.name = referencedTable.name.substring(4);
    }

    const key_columns: string[] = referencingTable
      .foreignKeyForReferencedTable(referencedTable)
      .columnNames();

    // Da FK nur 40 Zeichen lang sein darf...
    const fk_name: string = 'fk_' + Math.random().toString(16).slice(2);

    const mapping: {}[] = [];
    for (let i = 0; i < key_columns.length; i++) {
      mapping.push({ key: key_columns[i], value: key_columns[i] });
    }

    const data = {
      referencingSchema: schema,
      referencingTable: referencingTable.name,
      referencedSchema: schema,
      referencedTable: referencedTable.name,
      constraintName: fk_name,
      mapping: mapping,
    };

    let result: any = this.http
      .post(`${this.baseUrl}/persist/createForeignKey`, data)
      .toPromise();

    return result;
  }

  getCreateTableSql(schema: string, table: Table): Promise<any> {
    if (table.name.startsWith('public.')) {
      table.name = table.name.substring(7);
    }

    if (table.name.startsWith('dbo.')) {
      table.name = table.name.substring(4);
    }

    const [originSchema, originTable]: string[] = table.origin.name.split('.');
    const [newSchema, newTable]: string[] = [schema, table.name];
    const primaryKey: string[] = table.keys()[0].columnNames();

    const data = {
      originSchema: originSchema,
      originTable: originTable,
      newSchema: newSchema,
      newTable: newTable,
      attribute: table.columns.columnNames().map((str) => {
        return { name: str };
      }),
      primaryKey: primaryKey,
    };
    let result: any = this.http
      .post(`${this.baseUrl}/persist/createTable`, data)
      .toPromise();
    return result;
  }
}
