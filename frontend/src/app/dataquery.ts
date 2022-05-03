import ITablePage from '@server/definitions/ITablePage';
import Column from '../model/schema/Column';
import Relationship from '../model/schema/Relationship';
import Table from '../model/schema/Table';
import { DatabaseService } from './database.service';

export abstract class DataQuery {
  protected databaseService: DatabaseService;
  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  public abstract loadTablePage(
    offset: number,
    limit: number
  ): Promise<ITablePage>;

  public abstract loadRowCount(): Promise<number>;
}

export class ViolatingINDRowsDataQuery extends DataQuery {
  protected relationship: Relationship;
  constructor(databaseService: DatabaseService, relationship: Relationship) {
    super(databaseService);
    this.relationship = relationship;
  }

  public override async loadTablePage(
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    return await this.databaseService.loadViolatingRowsForIND(
      this.relationship,
      offset,
      limit
    );
  }

  public override async loadRowCount(): Promise<number> {
    return await this.databaseService.loadViolatingRowsForINDCount(
      this.relationship
    );
  }
}

export class ViolatingFDRowsDataQuery extends DataQuery {
  protected table: Table;
  protected lhs: Array<Column>;
  protected rhs: Array<Column>;
  constructor(
    databaseService: DatabaseService,
    table: Table,
    lhs: Array<Column>,
    rhs: Array<Column>
  ) {
    super(databaseService);
    this.table = table;
    this.lhs = lhs;
    this.rhs = rhs;
  }

  public override async loadTablePage(
    offset: number,
    limit: number
  ): Promise<ITablePage> {
    return await this.databaseService.loadViolatingRowsForFD(
      this.table,
      this.lhs,
      this.rhs,
      offset,
      limit
    );
  }

  public override async loadRowCount(): Promise<number> {
    return await this.databaseService.loadViolatingRowsForFDCount(
      this.table,
      this.lhs,
      this.rhs
    );
  }
}
