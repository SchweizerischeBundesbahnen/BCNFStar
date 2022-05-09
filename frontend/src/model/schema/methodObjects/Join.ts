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

  public sourceMapping = new Map<SourceTableInstance, SourceTableInstance>();

  public constructor(
    private schema: Schema,
    fk: TableRelationship,
    private name?: string
  ) {
    this.referencing = fk.referencing;
    this.referenced = fk.referenced;
    this.relationship = fk.relationship;

    this.join();

    this.schema.calculateFdsOf(this.newTable);
  }

  private join() {
    // name, pk
    this.newTable.pk = this.referencing.pk?.deepCopy();
    this.newTable.schemaName = this.referencing.schemaName;
    this.newTable.name = this.referencing.name;

    // inherit sources, columns and relationships from referencing table
    this.referencing.sources.forEach((sourceTable) =>
      this.newTable.sources.push(sourceTable)
    );
    this.newTable.addColumns(...this.referencing.columns.deepCopy());
    this.newTable.relationships.push(...this.referencing.relationships);

    // sources and relationships from referenced table
    for (const source of this.referenced.sourcesTopological().reverse()) {
      if (this.referenced.isRoot(source)) {
        if (this.relationship.sourceRelationship().isTrivial) {
          this.sourceMapping.set(
            source,
            this.relationship.referencing[0].sourceTableInstance
          );
        } else {
          this.sourceMapping.set(
            source,
            this.newTable.addSource(source.table, this.name)
          );
          this.newTable.relationships.push(
            this.relationship.applySourceMapping(this.sourceMapping)
          );
        }
      } else {
        const equivalentSource = this.findEquivalentSource(source);

        if (equivalentSource) {
          this.sourceMapping.set(source, equivalentSource);
        } else {
          this.sourceMapping.set(
            source,
            this.newTable.addSource(source.table, this.name)
          );
          this.newTable.relationships.push(
            this.referenced.relationships
              .find(
                (relationship) =>
                  relationship.referenced[0].sourceTableInstance == source
              )!
              .applySourceMapping(this.sourceMapping)
          );
        }
      }
    }

    // columns from referenced table
    this.newTable.addColumns(
      ...this.referenced.columns
        .deepCopy()
        .applySourceMapping(this.sourceMapping)
    );
    this.newTable.establishIdentities();
    if (!this.relationship.sourceRelationship().isTrivial) {
      this.newTable.removeColumns(
        ...this.relationship.referenced.map((column) =>
          column.applySourceMapping(this.sourceMapping)
        )
      );
    }
  }

  private findEquivalentSource(
    source: SourceTableInstance
  ): SourceTableInstance | undefined {
    const relToSource = this.referenced.relationships.find(
      (relationship) => relationship.referenced[0].sourceTableInstance == source
    )!;
    const equivalentReferencingColumns = new ColumnCombination(
      relToSource.referencing.map((column) =>
        column.applySourceMapping(this.sourceMapping)
      )
    );
    return this.newTable.relationships.find(
      (rel) =>
        new ColumnCombination(rel.referencing).equals(
          equivalentReferencingColumns
        ) && rel.referenced[0].sourceTableInstance.table.equals(source.table)
    )?.referenced[0].sourceTableInstance;
  }
}
