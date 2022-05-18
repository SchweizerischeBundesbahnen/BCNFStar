import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '@server/definitions/ITable';
import ITablePage from '@server/definitions/ITablePage';
import IFunctionalDependency from '@server/definitions/IFunctionalDependency';
import Table from '../model/schema/Table';
import Schema from '../model/schema/Schema';
import { firstValueFrom } from 'rxjs';
import IForeignKey from '@server/definitions/IForeignKey';
import IPrimaryKey from '@server/definitions/IPrimaryKey';
import IInclusionDependency from '@server/definitions/IInclusionDependency';
import ColumnCombination from '../model/schema/ColumnCombination';
import SourceColumn from '../model/schema/SourceColumn';
import SourceRelationship from '../model/schema/SourceRelationship';
import SourceFunctionalDependency from '../model/schema/SourceFunctionalDependency';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
import { IMetanomeJob } from '@server/definitions/IMetanomeJob';

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

  public async getDmbsName(): Promise<string> {
    return firstValueFrom(
      this.http.get<string>(`${this.baseUrl}/persist/dbmsname`)
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

  /**
   * Creates InputSchema for use on edit-schema page with the supplied tables
   * @param tables used on edit-schema page
   * @param indFile name of a metanome results file that contains INDs for all the tables
   * @param fdFiles Record that maps from table.schemaAndName to FD result file name
   */
  public async setInputTables(
    tables: Array<Table>,
    indFile: string,
    fdFiles: Record<string, string>
  ) {
    const fdPromises = new Map<Table, Promise<Array<IFunctionalDependency>>>();
    for (const table of tables) {
      if (fdFiles[table.fullName]) {
        fdPromises.set(
          table,
          this.getMetanomeResult(fdFiles[table.fullName]) as Promise<
            Array<IFunctionalDependency>
          >
        );
      }
    }

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

    for (const [table, tableFds] of fdPromises.entries()) {
      this.resolveFds(await tableFds, table);
    }

    if (indFile) {
      const indPromise = this.getMetanomeResult(indFile) as Promise<
        Array<IInclusionDependency>
      >;
      this.resolveInds(await indPromise);
    }

    this.resolveIFks(this.iFks);
    this.resolveIPks(this.iPks);
  }

  public async runMetanome(entry: IIndexFileEntry) {
    const job: IMetanomeJob = {
      algoClass: entry.algorithm,
      config: entry.config,
      schemaAndTables: entry.tables,
    };
    return await firstValueFrom(
      this.http.post<{ message: string; fileName: string }>(
        `${this.baseUrl}/metanomeResults/`,
        job
      )
    );
  }

  private getMetanomeResult(fileName: string) {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/metanomeResults/${fileName}`)
    );
  }
}
