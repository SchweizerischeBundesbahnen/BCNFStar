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
    this.schema.deleteTables(this.referencing);
    this.schema.deleteTables(this.referenced);

    this.schema.calculateFdsOf(this.newTable);
  }

  private join() {
    // source tables
    this.referencing.sources.forEach((sourceTable) =>
      this.newTable.sources.push(sourceTable)
    );
    this.newTable.relationships.push(...this.referencing.relationships);

    const sourceMapping = new Map<SourceTableInstance, SourceTableInstance>();
    if (this.relationship.sourceRelationship().isTrivial) {
      sourceMapping.set(
        new ColumnCombination(
          this.relationship.referenced
        ).sourceTableInstance(),
        new ColumnCombination(
          this.relationship.referencing
        ).sourceTableInstance()
      );
      for (const source of this.referenced
        .sourcesTopological()
        .reverse()
        .slice(1)) {
        const relToSource = this.referenced.relationships.find(
          (relationship) =>
            relationship.referenced[0].sourceTableInstance == source
        )!;
        const equivalentReferencingColumns = new ColumnCombination(
          relToSource.referencing.map((column) =>
            column.applySourceMapping(sourceMapping)
          )
        );
        const equivalentRelationship = this.referencing.relationships.find(
          (rel) =>
            new ColumnCombination(rel.referencing).equals(
              equivalentReferencingColumns
            ) && rel.referenced[0].sourceTableInstance.table == source.table
        );
        if (equivalentRelationship) {
          const equivalentSource =
            equivalentRelationship.referenced[0].sourceTableInstance;
          sourceMapping.set(source, equivalentSource);
        } else {
          const newSource = this.newTable.addSource(source.table, this.name);
          sourceMapping.set(source, newSource);
          // ????
          this.newTable.relationships.push(
            new Relationship(
              relToSource.referencing.map((column) =>
                column.applySourceMapping(sourceMapping)
              ),
              relToSource.referenced.map((column) =>
                column.applySourceMapping(sourceMapping)
              )
            )
          );
        }
      }
    } else {
      // ????
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
    }

    // this.referenced.sources.forEach((source) => {
    //   const newSource = this.newTable.addSource(source.table, this.name);
    //   sourceMapping.set(source, newSource);
    // });

    // // relationships
    // this.newTable.relationships.push(...this.referencing.relationships);
    // this.newTable.relationships.push(
    //   ...this.referenced.relationships.map(
    //     (rel) =>
    //       new Relationship(
    //         rel.referencing.map((column) =>
    //           column.applySourceMapping(sourceMapping)
    //         ),
    //         rel.referenced.map((column) =>
    //           column.applySourceMapping(sourceMapping)
    //         )
    //       )
    //   )
    // );
    // this.newTable.relationships.push(
    //   new Relationship(
    //     this.relationship.referencing,
    //     this.relationship.referenced.map((column) =>
    //       column.applySourceMapping(sourceMapping)
    //     )
    //   )
    // );

    // columns
    this.newTable.columns.add(...this.referencing.columns);
    this.newTable.columns.add(
      ...this.referenced.columns
        .copy()
        .setMinus(new ColumnCombination(this.relationship.referenced))
        .applySourceMapping(sourceMapping)
    );

    // name, pk
    this.newTable.pk = this.referencing.pk;
    this.newTable.schemaName = this.referencing.schemaName;
    this.newTable.name = this.referencing.name;
  }
}
