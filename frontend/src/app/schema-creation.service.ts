import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import IForeignKey from '@server/definitions/IForeignKey';
import IFunctionalDependency from '@server/definitions/IFunctionalDependency';
import IInclusionDependency from '@server/definitions/IInclusionDependency';
import IPrimaryKey from '@server/definitions/IPrimaryKey';
import { firstValueFrom } from 'rxjs';
import ColumnCombination from '../model/schema/ColumnCombination';
import Schema from '../model/schema/Schema';
import SourceColumn from '../model/schema/SourceColumn';
import SourceFunctionalDependency from '../model/schema/SourceFunctionalDependency';
import SourceRelationship from '../model/schema/SourceRelationship';
import Table from '../model/schema/Table';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class SchemaCreationService {
  constructor(private http: HttpClient, private dataService: DatabaseService) {}

  private getMetanomeResult<T>(fileName: string): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(
        `${this.dataService.baseUrl}/metanomeResults/${fileName}`
      )
    );
  }

  private async getInds(
    indFile: string,
    sourceColumns: Map<string, SourceColumn>
  ): Promise<SourceRelationship[]> {
    const iInds = await this.getMetanomeResult<IInclusionDependency[]>(indFile);
    const inds: Array<SourceRelationship> = [];
    iInds.forEach((iInd) => {
      let ind = new SourceRelationship();
      for (const i in iInd.dependant.columnIdentifiers) {
        let dependantIColumn = iInd.dependant.columnIdentifiers[i];
        let dependantColumn = sourceColumns.get(
          `${dependantIColumn.schemaIdentifier}.${dependantIColumn.tableIdentifier}.${dependantIColumn.columnIdentifier}`
        );

        let referencedIColumn = iInd.referenced.columnIdentifiers[i];
        let referencedColumn = sourceColumns.get(
          `${referencedIColumn.schemaIdentifier}.${referencedIColumn.tableIdentifier}.${referencedIColumn.columnIdentifier}`
        );

        if (!dependantColumn || !referencedColumn) continue;

        ind.referencing.push(dependantColumn!);
        ind.referenced.push(referencedColumn!);
      }

      if (ind.referencing.length > 0) inds.push(ind);
    });
    return inds;
  }

  public async setFds(
    fdFiles: Map<Table, string>,
    sourceColumns: Map<string, SourceColumn>
  ): Promise<Array<SourceFunctionalDependency>> {
    const fdPromises = new Map<Table, Promise<Array<IFunctionalDependency>>>();
    const fds: Array<SourceFunctionalDependency> = [];
    for (const [table, file] of fdFiles.entries())
      if (file)
        fdPromises.set(
          table,
          this.getMetanomeResult<Array<IFunctionalDependency>>(file)
        );
    for (const [table, promise] of fdPromises.entries()) {
      const iFds = await promise;
      for (const iFd of iFds) {
        const lhs = iFd.lhsColumns.map(
          (colName) =>
            sourceColumns.get(`${table.schemaName}.${table.name}.${colName}`)!
        );
        const rhs = iFd.rhsColumns.map(
          (colName) =>
            sourceColumns.get(`${table.schemaName}.${table.name}.${colName}`)!
        );
        fds.push(new SourceFunctionalDependency(lhs, rhs));
      }
    }
    return fds;
  }

  private async getPrimaryKeys(
    tables: Array<Table>
  ): Promise<Map<Table, ColumnCombination>> {
    const pks = await firstValueFrom(
      this.http.get<Array<IPrimaryKey>>(this.dataService.baseUrl + '/pks')
    );
    const result = new Map<Table, ColumnCombination>();
    for (const pk of pks) {
      let table: Table | undefined = tables.find(
        (table) =>
          table.schemaName == pk.table_schema && table.name == pk.table_name
      );
      if (table)
        result.set(
          table,
          new ColumnCombination(
            table.columns
              .asArray()
              .filter((column) =>
                pk.attributes.includes(column.sourceColumn.name)
              )
          )
        );
    }
    return result;
  }

  private async getForeignKeys(
    sourceColumns: Map<string, SourceColumn>
  ): Promise<Array<SourceRelationship>> {
    const iFks = await firstValueFrom(
      this.http.get<Array<IForeignKey>>(this.dataService.baseUrl + '/fks')
    );
    const result: Array<SourceRelationship> = [];
    for (const iFk of iFks) {
      let fk = new SourceRelationship();
      for (const i in iFk.referencing) {
        let referencingIColumn = iFk.referencing[i];
        let referencingColumn = sourceColumns.get(
          `${referencingIColumn.schemaIdentifier}.${referencingIColumn.tableIdentifier}.${referencingIColumn.columnIdentifier}`
        );

        let referencedIColumn = iFk.referenced[i];
        let referencedColumn = sourceColumns.get(
          `${referencedIColumn.schemaIdentifier}.${referencedIColumn.tableIdentifier}.${referencedIColumn.columnIdentifier}`
        );

        // in case the foreign key is not fully contained in the selection of tables
        if (!referencingColumn || !referencedColumn) continue;

        fk.referencing.push(referencingColumn);
        fk.referenced.push(referencedColumn);
      }
      if (fk.referenced.length) result.push(fk);
    }
    return result;
  }

  /**
   * Creates InputSchema for use on edit-schema page with the supplied tables
   * @param tables used on edit-schema page
   * @param indFile name of a metanome results file that contains INDs for all the tables
   * @param fdFiles Record that maps from table.schemaAndName to FD result file name
   */
  public async createSchema(
    tables: Array<Table>,
    fdFiles: Map<Table, string>,
    indFile?: string
  ): Promise<Schema> {
    const schema = new Schema(...tables);
    /** this is used for looking up existing SourceColumns to cut down on later comparisons and memory */
    const sourceColumns = new Map<string, SourceColumn>();

    for (const table of tables) {
      let sourceTable = [...table.sources][0].table;
      for (const column of table.columns.asArray())
        sourceColumns.set(
          `${sourceTable.fullName}.${column.sourceColumn.name}`,
          column.sourceColumn
        );
    }
    const fdPromise = this.setFds(fdFiles, sourceColumns);
    const fkPromise = this.getForeignKeys(sourceColumns);
    const pkPromise = this.getPrimaryKeys(tables);
    if (indFile) {
      const indPromise = this.getInds(indFile, sourceColumns);
      schema.addInd(...(await indPromise));
    }

    schema.addFk(...(await fkPromise));

    for (const fd of await fdPromise) schema.addFd(fd);
    for (const [table, pk] of (await pkPromise).entries()) table.pk = pk;

    for (const table of schema.tables) {
      schema.clearFdsFor(table.sources[0].table);
      schema.calculateFdsOf(table);
    }
    return schema;
  }
}
