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
    this.replaceUnnecessarySources(
      this.sourceMapping.get(source)!,
      relToSource
    );
    this.newTable.relationships.push(
      relToSource.applySourceMapping(this.sourceMapping)
    );
    this.resolveChildSources(source, true);
  }

  private join() {
    // name, pk
    this.newTable.pk = this.referencing.pk?.deepCopy();
    this.newTable.schemaName = this.referencing.schemaName;
    this.newTable.name = this.referencing.name;

    // inherit sources and relationships from referencing table
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

    // columns
    this.newTable.addColumns(
      ...this.referencing.columns.applySourceMapping(this.sourceMapping)
    );
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
        rel.referenced[0].sourceTableInstance.table.equals(source.table) &&
        equivalentReferencingColumns.isSubsetOf(
          new ColumnCombination(rel.referencing)
        )
    )?.referenced[0].sourceTableInstance;
  }

  private replaceUnnecessarySources(
    newSource: SourceTableInstance,
    relToSource: Relationship
  ) {
    const equivalentReferencingColumns = new ColumnCombination(
      relToSource.referencing
    ).applySourceMapping(this.sourceMapping);
    const replaceableRels = this.newTable.relationships.filter(
      (rel) =>
        rel.referenced[0].sourceTableInstance.table.equals(newSource.table) &&
        new ColumnCombination(rel.referencing).isSubsetOf(
          equivalentReferencingColumns
        )
    );
    if (replaceableRels.length == 0) return;
    const replaceableSources = replaceableRels.map(
      (rel) => rel.referenced[0].sourceTableInstance
    );
    this.newTable.relationships = this.newTable.relationships.filter(
      (rel) => !replaceableRels.includes(rel)
    );
    this.newTable.sources = this.newTable.sources.filter(
      (source) => !replaceableSources.includes(source)
    );
    for (const [oldSource, mappedSource] of Array.from(
      this.sourceMapping.entries()
    ))
      if (replaceableSources.includes(mappedSource))
        this.sourceMapping.set(oldSource, newSource);
  }

  private newUserAlias(prevName: string): string {
    let newUserAlias: string = '';
    if (this.name) newUserAlias += this.name + '_';
    newUserAlias += prevName;
    return newUserAlias;
  }
}
