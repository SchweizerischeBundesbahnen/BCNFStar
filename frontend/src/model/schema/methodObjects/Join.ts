import { TableRelationship } from '../../types/TableRelationship';
import Relationship from '../Relationship';
import Schema from '../Schema';
import SourceTableInstance from '../SourceTableInstance';
import Table from '../Table';

export default class Join {
  public newTable = new Table();

  private referencing: Table;
  private referenced: Table;
  private relationship: Relationship;

  public constructor(
    private schema: Schema,
    fk: TableRelationship,
    private name?: string
  ) {
    this.referencing = fk.referencing;
    this.referenced = fk.referenced;
    this.relationship = fk.relationship;

    this.join();

    this.schema.addTables(this.newTable);
    this.schema.deleteTables(fk.referencing);
    this.schema.deleteTables(fk.referenced);

    this.schema.calculateFdsOf(this.newTable);
  }

  private join() {
    // source tables
    this.referencing.sources.forEach((sourceTable) =>
      this.newTable.sources.push(sourceTable)
    );

    const sourceMapping = new Map<SourceTableInstance, SourceTableInstance>();
    this.referenced.sources.forEach((source) => {
      const newSource = this.newTable.addSource(source.table, this.name);
      sourceMapping.set(source, newSource);
    });

    // columns
    this.newTable.columns.add(...this.referencing.columns);
    this.newTable.columns.add(
      ...this.referenced.columns.applySourceMapping(sourceMapping)
    );
    this.newTable.columns.delete(...this.relationship.referenced);

    // relationships
    this.newTable.relationships.push(...this.referencing.relationships);
    this.newTable.relationships.push(
      ...this.referenced.relationships.map((rel) =>
        rel.applySourceMapping(sourceMapping)
      )
    );
    if (!this.relationship.sourceRelationship().isTrivial) {
      this.newTable.relationships.push(
        this.relationship.applySourceMapping(sourceMapping)
      );
    }

    // name, pk
    this.newTable.name = this.referencing.name;
    this.newTable.schemaName = this.referencing.schemaName;

    this.newTable.pk = this.referencing.pk;
  }
}
