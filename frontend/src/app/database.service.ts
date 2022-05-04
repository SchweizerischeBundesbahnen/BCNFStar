import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import ITablePage from '@server/definitions/ITablePage';
import IFunctionalDependency from '@server/definitions/IFunctionalDependency';
import {
  IRequestBodyCreateTableSql,
  IRequestBodyDataTransferSql,
  IRequestBodyForeignKeySql,
} from '@server/definitions/IBackendAPI';
import IRequestBodyFDViolatingRows from '@server/definitions/IRequestBodyFDViolatingRows';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import Relationship from '../model/schema/Relationship';
import { firstValueFrom } from 'rxjs';
import IForeignKey from '@server/definitions/IForeignKey';
import IPrimaryKey from '@server/definitions/IPrimaryKey';
import Column from '../model/schema/Column';
import IInclusionDependency from '@server/definitions/IInclusionDependency';
import IRelationship from '@server/definitions/IRelationship';
import ColumnCombination from '../model/schema/ColumnCombination';
import SourceColumn from '../model/schema/SourceColumn';
import SourceRelationship from '../model/schema/SourceRelationship';
import SourceFunctionalDependency from '../model/schema/SourceFunctionalDependency';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public schema?: Schema;
  /** this is used for looking up existing SourceColumns to cut down on later comparisons and memory */
  public sourceColumns = new Map<string, SourceColumn>();

  /**
   * when using the angular dev server, you need to access another adress
   * for the BCNFStar express server. It is assumed that this server is
   * at http://localhost:80. In production mode, the serving server is assumed
   * to be the BCNFStar express server (found in backend/index.ts)
   **/
  public baseUrl: string = isDevMode() ? 'http://localhost:80' : '';
  private iFks: Array<IForeignKey> = [];
  private iPks: Array<IPrimaryKey> = [];

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  public async loadTables(): Promise<Array<Table>> {
    this.iFks = await this.getIFks();
    this.iPks = await this.getIPks();
    return this.getTables();
  }

  public loadTablePage(
    schema: string,
    table: string,
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    return firstValueFrom(
      this.http.get<ITablePage>(
        `${this.baseUrl}/tables/page?schema=${schema}&table=${table}&offset=${offset}&limit=${limit}`
      )
    );
  }

  public loadTableRowCounts(): Promise<Record<string, number>> {
    return firstValueFrom(
      this.http.get<Record<string, number>>(`${this.baseUrl}/tables/rows`)
    );
  }

  private async getTables(): Promise<Array<Table>> {
    const iTables = await firstValueFrom(
      this.http.get<Array<ITable>>(this.baseUrl + '/tables')
    );
    const tables = iTables.map((iTable) => Table.fromITable(iTable));
    return tables;
  }

  private getIPks(): Promise<Array<IPrimaryKey>> {
    return firstValueFrom(
      this.http.get<Array<IPrimaryKey>>(this.baseUrl + '/pks')
    );
  }

  private resolveIPks(pks: Array<IPrimaryKey>) {
    pks.forEach((fk) => {
      let table: Table | undefined = [...this.schema!.tables].find(
        (table) =>
          table.schemaName == fk.table_schema && table.name == fk.table_name
      );
      if (table) {
        table!.pk = new ColumnCombination(
          table!.columns
            .asArray()
            .filter((column) =>
              fk.attributes.includes(column.sourceColumn.name)
            )
        );
      }
    });
  }

  private getIFks(): Promise<Array<IForeignKey>> {
    return firstValueFrom(
      this.http.get<Array<IForeignKey>>(this.baseUrl + '/fks')
    );
  }

  private resolveIFks(iFks: Array<IForeignKey>) {
    iFks.forEach((iFk) => {
      let fk = new SourceRelationship();
      for (const i in iFk.referencing) {
        let referencingIColumn = iFk.referencing[i];
        let referencingColumn = this.sourceColumns.get(
          `${referencingIColumn.schemaIdentifier}.${referencingIColumn.tableIdentifier}.${referencingIColumn.columnIdentifier}`
        );

        let referencedIColumn = iFk.referenced[i];
        let referencedColumn = this.sourceColumns.get(
          `${referencedIColumn.schemaIdentifier}.${referencedIColumn.tableIdentifier}.${referencedIColumn.columnIdentifier}`
        );

        // in case the foreign key is not fully contained in the selection of tables
        if (!referencingColumn || !referencedColumn) continue;

        fk.referencing.push(referencingColumn);
        fk.referenced.push(referencedColumn);
      }
      if (fk.referencing.length > 0) this.schema!.addFk(fk);
    });
  }

  private resolveInds(iInds: Array<IInclusionDependency>) {
    iInds.forEach((iInd) => {
      let ind = new SourceRelationship();
      for (const i in iInd.dependant.columnIdentifiers) {
        let dependantIColumn = iInd.dependant.columnIdentifiers[i];
        let dependantColumn = this.sourceColumns.get(
          `${dependantIColumn.schemaIdentifier}.${dependantIColumn.tableIdentifier}.${dependantIColumn.columnIdentifier}`
        );

        let referencedIColumn = iInd.referenced.columnIdentifiers[i];
        let referencedColumn = this.sourceColumns.get(
          `${referencedIColumn.schemaIdentifier}.${referencedIColumn.tableIdentifier}.${referencedIColumn.columnIdentifier}`
        );

        if (!dependantColumn || !referencedColumn) continue;

        ind.referencing.push(dependantColumn!);
        ind.referenced.push(referencedColumn!);
      }
      if (ind.referencing.length > 0) this.schema!.addInd(ind);
    });
  }

  public resolveFds(fds: Array<IFunctionalDependency>, table: Table) {
    for (const fd of fds) {
      const lhs = fd.lhsColumns.map(
        (colName) =>
          this.sourceColumns.get(
            `${table.schemaName}.${table.name}.${colName}`
          )!
      );
      const rhs = fd.rhsColumns.map(
        (colName) =>
          this.sourceColumns.get(
            `${table.schemaName}.${table.name}.${colName}`
          )!
      );
      this.schema!.addFd(new SourceFunctionalDependency(lhs, rhs));
    }
    this.schema!.calculateFdsOf(table);
  }

  public async setInputTables(tables: Array<Table>) {
    const inds = this.getINDs(tables);
    const fds = tables.map(
      (table) =>
        [table, this.getFDs(table)] as [Table, Promise<IFunctionalDependency[]>]
    );

    this.schema = new Schema(...tables);
    for (const table of tables) {
      let sourceTable = [...table.sources][0].table;
      table.columns
        .asArray()
        .forEach((column) =>
          this.sourceColumns.set(
            `${sourceTable.fullName}.${column.sourceColumn.name}`,
            column.sourceColumn
          )
        );
    }

    for (const [table, tableFds] of fds) {
      this.resolveFds(await tableFds, table);
    }
    this.resolveInds(await inds);
    this.resolveIFks(this.iFks);
    this.resolveIPks(this.iPks);
  }

  private getFDs(table: Table): Promise<Array<IFunctionalDependency>> {
    return firstValueFrom(
      this.http.get<Array<IFunctionalDependency>>(
        `${this.baseUrl}/tables/${table.fullName}/fds`
      )
    );
  }

  private getINDs(tables: Array<Table>): Promise<Array<IInclusionDependency>> {
    let tableNamesConcatenation = tables
      .map((table) => table.fullName)
      .join(',');
    return firstValueFrom(
      this.http.get<Array<IInclusionDependency>>(
        `${this.baseUrl}/tables/${tableNamesConcatenation}/inds`
      )
    );
  }

  public getForeignKeySql(
    referencing: Table,
    relationship: Relationship,
    referenced: Table
  ): Promise<{ sql: string }> {
    const fk_name: string = 'fk_' + Math.random().toString(16).slice(2);

    const relationship_: IRelationship = {
      referencing: referencing.toITable(),
      referenced: referenced.toITable(),
      columnRelationships: referenced.pk!.inOrder().map((element) => {
        return {
          referencingColumn:
            relationship.referencing[
              relationship.referenced.indexOf(
                relationship.referenced.find((c) => c.equals(element))!
              )
            ].name,
          referencedColumn: element.name,
        };
      }),
    };

    const data: IRequestBodyForeignKeySql = {
      name: fk_name,
      relationship: relationship_,
    };

    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/createForeignKey`,
        data
      )
    );
  }

  public getSchemaPreparationSql(
    schemaName: string,
    tables: Table[]
  ): Promise<{ sql: string }> {
    const data = {
      schema: schemaName,
      tables: tables.map((table) => table.name),
    };
    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/schemaPreparation`,
        data
      )
    );
  }

  public getDataTransferSql(
    table: Table,
    attributes: Column[]
  ): Promise<{ sql: string }> {
    const data: IRequestBodyDataTransferSql = {
      newSchema: table.schemaName!,
      newTable: table.name,
      relationships: [...table.relationships].map((rel) =>
        rel.toIRelationship()
      ),
      sourceTables: Array.from(table.sources).map(
        (source) => `${source.table.fullName}`
      ),
      attributes: attributes.map((attr) => attr.toIAttribute()),
    };

    let result = firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/dataTransfer`,
        data
      )
    );
    return result;
  }

  public getPrimaryKeySql(
    schema: string,
    table: string,
    primaryKey: string[]
  ): Promise<{ sql: string }> {
    const data = {
      schema: schema,
      table: table,
      primaryKey: primaryKey,
    };
    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/createPrimaryKey`,
        data
      )
    );
  }

  public async loadViolatingRowsForFD(
    table: Table,
    _lhs: Column[],
    _rhs: Column[],
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    // currently supports only check on "sourceTables".
    if (table.sources.length != 1) throw Error('Not Implemented Exception');

    const data: IRequestBodyFDViolatingRows = {
      schema: table.sources[0].table.schemaName,
      table: table.sources[0].table.name,
      lhs: _lhs.map((c) => c.name),
      rhs: _rhs.map((c) => c.name),
      offset: offset,
      limit: limit,
    };
    return firstValueFrom(
      this.http.post<ITablePage>(`${this.baseUrl}/violatingRows/fd`, data)
    );
  }

  public async loadViolatingRowsForFDCount(
    table: Table,
    _lhs: Column[],
    _rhs: Column[]
  ): Promise<number> {
    // currently supports only check on "sourceTables".
    if (table.sources.length != 1) throw Error('Not Implemented Exception');

    const data: IRequestBodyFDViolatingRows = {
      schema: table.sources[0].table.schemaName,
      table: table.sources[0].table.name,
      lhs: _lhs.map((c) => c.name),
      rhs: _rhs.map((c) => c.name),
      offset: 0,
      limit: 0,
    };
    return firstValueFrom(
      this.http.post<number>(`${this.baseUrl}/violatingRows/rowcount/fd`, data)
    );
  }

  public getCreateTableSql(table: Table): Promise<{ sql: string }> {
    const [newSchema, newTable]: string[] = [table.schemaName, table.name];
    let primaryKey: string[] = [];
    if (table.pk) {
      primaryKey = table.pk!.columnNames();
    }
    const data: IRequestBodyCreateTableSql = {
      newSchema: newSchema,
      newTable: newTable,
      attributes: table.columns
        .asArray()
        .map((column) => column.toIAttribute()),
      primaryKey: primaryKey,
    };
    return firstValueFrom(
      this.http.post<{ sql: string }>(
        `${this.baseUrl}/persist/createTable`,
        data
      )
    );
  }
}
