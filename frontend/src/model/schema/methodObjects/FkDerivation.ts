import Column from '../Column';
import ColumnCombination from '../ColumnCombination';
import Relationship from '../Relationship';
import SourceColumn from '../SourceColumn';
import SourceRelationship from '../SourceRelationship';
import TableRelationship from '../TableRelationship';

abstract class FkDerivation<RelType, ColType> {
  public result: Array<RelType>;

  constructor(public existingRels: Array<RelType>, public fk: RelType) {
    this.result = [fk];
    const fksToReferencing = this.existingRels.filter(
      (otherRel) => otherRel == fk || this.areConnected(otherRel, fk)
    );
    const fksFromReferenced = this.existingRels.filter(
      (otherRel) => otherRel == fk || this.areConnected(fk, otherRel)
    );
    for (const fkToReferencing of fksToReferencing) {
      for (const fkFromReferenced of fksFromReferenced) {
        if (fkToReferencing == fkFromReferenced) continue;
        const newRelReferencing = new Array<ColType>();
        for (const referencedCol of this.referencingColumns(fkFromReferenced)) {
          const col = this.referencedColumns(fkToReferencing).find(
            (referencingCol) => {
              if (fkToReferencing == fk || fkFromReferenced == fk)
                return this.areEqual(referencingCol, referencedCol);
              else return this.relMapsCols(fk, referencingCol, referencedCol);
            }
          );
          if (!col) break;
          newRelReferencing.push(col);
        }
        if (
          newRelReferencing.length ==
          this.referencedColumns(fkFromReferenced).length
        )
          this.result.push(
            this.constructFk(
              fkToReferencing,
              fkFromReferenced,
              newRelReferencing
            )
          );
      }
    }
  }

  abstract areConnected(rel1: RelType, rel2: RelType): boolean;
  abstract referencingColumns(rel: RelType): Array<ColType>;
  abstract referencedColumns(rel: RelType): Array<ColType>;
  abstract areEqual(col1: ColType, col2: ColType): boolean;
  abstract relMapsCols(rel: RelType, col1: ColType, col2: ColType): boolean;
  abstract constructFk(
    fkToReferencing: RelType,
    fkFromReferenced: RelType,
    newRelReferencing: Array<ColType>
  ): RelType;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SourceFkDerivation extends FkDerivation<
  SourceRelationship,
  SourceColumn
> {
  override areConnected(
    rel1: SourceRelationship,
    rel2: SourceRelationship
  ): boolean {
    for (const col of rel2.referencing) {
      if (!rel1.referenced.some((otherCol) => otherCol.equals(col)))
        return false;
    }
    return true;
  }

  override referencingColumns(rel: SourceRelationship): SourceColumn[] {
    return rel.referencing;
  }

  override referencedColumns(rel: SourceRelationship): SourceColumn[] {
    return rel.referenced;
  }

  override areEqual(col1: SourceColumn, col2: SourceColumn): boolean {
    return col1.equals(col2);
  }

  override relMapsCols(
    rel: SourceRelationship,
    col1: SourceColumn,
    col2: SourceColumn
  ): boolean {
    return rel.sourceColumnsMapped(col1, col2);
  }

  override constructFk(
    fkToReferencing: SourceRelationship,
    fkFromReferenced: SourceRelationship,
    newRelReferencing: SourceColumn[]
  ): SourceRelationship {
    return new SourceRelationship(
      newRelReferencing,
      Array.from(fkFromReferenced.referenced)
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CurrentFkDerivation extends FkDerivation<TableRelationship, Column> {
  override areConnected(
    rel1: TableRelationship,
    rel2: TableRelationship
  ): boolean {
    return (
      rel1.referenced == rel2.referencing &&
      new ColumnCombination(rel2.relationship.referencing).isSubsetOf(
        new ColumnCombination(rel1.relationship.referenced)
      )
    );
  }

  override referencingColumns(rel: TableRelationship): Column[] {
    return rel.relationship.referencing;
  }

  override referencedColumns(rel: TableRelationship): Column[] {
    return rel.relationship.referenced;
  }

  override areEqual(col1: Column, col2: Column): boolean {
    return col1.equals(col2);
  }

  override relMapsCols(
    rel: TableRelationship,
    col1: Column,
    col2: Column
  ): boolean {
    return rel.relationship.columnsMapped(col1, col2);
  }

  override constructFk(
    fkToReferencing: TableRelationship,
    fkFromReferenced: TableRelationship,
    newRelReferencing: Column[]
  ): TableRelationship {
    return new TableRelationship(
      new Relationship(
        newRelReferencing,
        Array.from(fkFromReferenced.relationship.referenced)
      ),
      fkToReferencing.referencing,
      fkFromReferenced.referenced
    );
  }
}
