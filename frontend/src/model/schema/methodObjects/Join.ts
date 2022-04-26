import { TableRelationship } from '../../types/TableRelationship';
import ColumnCombination from '../ColumnCombination';
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
      ...this.referenced.columns
        .copy()
        .setMinus(new ColumnCombination(this.relationship.referenced))
        .applySourceMapping(sourceMapping)
    );
    //this.newTable.columns.delete(...this.relationship.referenced);

    // relationships
    this.newTable.relationships.push(...this.referencing.relationships);
    this.newTable.relationships.push(
      ...this.referenced.relationships.map(
        (rel) =>
          new Relationship(
            rel.referencing.map((column) =>
              column.applySourceMapping(sourceMapping)
            ),
            rel.referenced.map((column) =>
              column.applySourceMapping(sourceMapping)
            )
          )
      )
    );
    this.newTable.relationships.push(
      new Relationship(
        this.relationship.referencing,
        this.relationship.referenced.map((column) =>
          column.applySourceMapping(sourceMapping)
        )
      )
    );

    // name, pk
    this.newTable.name = this.referencing.name;
    this.newTable.schemaName = this.referencing.schemaName;

    this.newTable.pk = this.referencing.pk;
  }
}
