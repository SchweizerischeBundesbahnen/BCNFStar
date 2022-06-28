import TableRelationship from '../TableRelationship';
import ColumnCombination from '../ColumnCombination';
import Relationship from '../Relationship';
import SourceTableInstance from '../SourceTableInstance';
import Table from '../Table';

export default class Join {
  public newTable = new Table();

  private referencing: Table;
  private referenced: Table;
  private relationship: Relationship;

  public sourceMapping = new Map<SourceTableInstance, SourceTableInstance>();

  public constructor(fk: TableRelationship, private name?: string) {
    this.referencing = fk.referencing;
    this.referenced = fk.referenced;
    this.relationship = fk.relationship;

    this.join();
  }

  private resolveChildSources(
    source: SourceTableInstance,
    definitelyNew: boolean
  ) {
    this.referenced.relationships
      .filter((rel) => rel.referencing[0].sourceTableInstance == source)
      .forEach((rel) =>
        this.addSourcesAndRels(
          rel.referenced[0].sourceTableInstance,
          rel,
          definitelyNew
        )
      );
  }

  private addSourcesAndRels(
    source: SourceTableInstance,
    relToSource: Relationship,
    definitelyNew: boolean
  ) {
    if (!definitelyNew) {
      const equivalentSource = this.findEquivalentSource(source, relToSource);
      if (equivalentSource) {
        this.sourceMapping.set(source, equivalentSource);
        this.resolveChildSources(source, false);
        return;
      }
    }
    this.sourceMapping.set(
      source,
      this.newTable.addSource(source.table, this.newUserAlias(source.baseAlias))
    );
    this.newTable.relationships.push(
      relToSource.applySourceMapping(this.sourceMapping)
    );
    this.resolveChildSources(source, true);
  }

  private join() {
    // name, pk, sk
    this.newTable.schemaName = this.referencing.schemaName;
    this.newTable.name = this.referencing.name;
    this.newTable.surrogateKey = this.referencing.surrogateKey;
    // update rowCount for redundance ranking and invalidate cluster for recalculation
    this.newTable.rowCount = this.referencing.rowCount;
    this.newTable._fdClusterValid = false;

    // inherit sources, relationships and columns from referencing table
    this.referencing.sources.forEach((source) => {
      this.sourceMapping.set(
        source,
        this.newTable.addSource(source.table, source.userAlias)
      );
    });
    this.newTable.relationships.push(
      ...this.referencing.relationships.map((rel) =>
        rel.applySourceMapping(this.sourceMapping)
      )
    );
    this.newTable.addColumns(
      ...this.referencing.columns.applySourceMapping(this.sourceMapping)
    );
    this.newTable.pk = this.referencing.pk?.applySourceMapping(
      this.sourceMapping
    );

    // sources and relationships from referenced table
    const referencedRootSource = this.referenced
      .sourcesTopological()
      .reverse()[0];
    if (this.relationship.sourceRelationship().isTrivial) {
      this.sourceMapping.set(
        referencedRootSource,
        this.sourceMapping.get(
          this.relationship.referencing[0].sourceTableInstance
        )!
      );
      this.resolveChildSources(referencedRootSource, false);
    } else {
      this.addSourcesAndRels(referencedRootSource, this.relationship, false);
    }

    // columns from referenced table
    this.newTable.addColumns(
      ...this.referenced.columns.applySourceMapping(this.sourceMapping)
    );
    this.newTable.establishIdentities();
    if (!this.relationship.sourceRelationship().isTrivial) {
      this.newTable.removeColumns(
        ...this.relationship.referenced.map((column) =>
          column.applySourceMapping(this.sourceMapping)
        )
      );
    }

    // set maxValues after joining
    const columns = [...this.referencing.columns, ...this.referenced.columns];
    this.newTable.columns.asArray().forEach((col) => {
      const filteredColumns = columns.filter((otherCol) =>
        otherCol.equals(col)
      );
      if (filteredColumns.length == 2) {
        // for foreign key columns use maxValue of referencing table
        col.maxValue = this.referencing.columns
          .asArray()
          .find((rcol) => rcol.equals(col))!.maxValue;
      }
      if (filteredColumns.length == 1) {
        // for non foreign key columns use maxValue of referencing or referenced table
        col.maxValue = filteredColumns.find((otherCol) =>
          otherCol.equals(col)
        )!.maxValue;
      } else {
        console.error('column does not exist, max Value could not be setted');
      }
    });
  }

  private findEquivalentSource(
    source: SourceTableInstance,
    relToSource: Relationship
  ): SourceTableInstance | undefined {
    const equivalentReferencingColumns = new ColumnCombination(
      relToSource.referencing
    ).applySourceMapping(this.sourceMapping);
    return this.newTable.relationships.find(
      (rel) =>
        equivalentReferencingColumns.isSubsetOf(
          new ColumnCombination(rel.referencing)
        ) && rel.referenced[0].sourceTableInstance.table.equals(source.table)
    )?.referenced[0].sourceTableInstance;
  }

  private newUserAlias(prevName: string): string {
    let newUserAlias: string = '';
    if (this.name) newUserAlias += this.name + '_';
    newUserAlias += prevName;
    return newUserAlias;
  }
}
