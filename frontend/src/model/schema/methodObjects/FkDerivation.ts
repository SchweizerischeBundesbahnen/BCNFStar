import Column from '../Column';
import Relationship from '../Relationship';
import SourceColumn from '../SourceColumn';
import SourceRelationship from '../SourceRelationship';
import TableRelationship from '../TableRelationship';

interface Comparable<T> {
  equals(t: T): boolean;
}

interface IRel<RelType, ColType> {
  isConnected(other: RelType): boolean;
  referencingCols: Array<ColType>;
  referencedCols: Array<ColType>;
  mapsColumns(col1: ColType, col2: ColType): boolean;
}

export abstract class FkDerivation<
  RelType extends IRel<RelType, ColType>,
  ColType extends Comparable<ColType>
> {
  public result: Array<RelType>;

  constructor(public existingRels: Array<RelType>, public fk: RelType) {
    this.result = [fk];
    const fksToReferencing = this.existingRels.filter(
      (otherRel) => otherRel == fk || otherRel.isConnected(fk)
    );
    const fksFromReferenced = this.existingRels.filter(
      (otherRel) => otherRel == fk || fk.isConnected(otherRel)
    );
    for (const fkToReferencing of fksToReferencing) {
      for (const fkFromReferenced of fksFromReferenced) {
        if (fkToReferencing == fkFromReferenced) continue;
        const newRelReferencing = new Array<ColType>();
        for (const referencedCol of fkFromReferenced.referencingCols) {
          const col = fkToReferencing.referencedCols.find((referencingCol) => {
            if (fkToReferencing == fk || fkFromReferenced == fk)
              return referencingCol.equals(referencedCol);
            else return fk.mapsColumns(referencingCol, referencedCol);
          });
          if (!col) break;
          newRelReferencing.push(col);
        }
        if (newRelReferencing.length == fkFromReferenced.referencedCols.length)
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
  override constructFk(
    fkToReferencing: SourceRelationship,
    fkFromReferenced: SourceRelationship,
    newRelReferencing: SourceColumn[]
  ): SourceRelationship {
    return new SourceRelationship(
      newRelReferencing,
      Array.from(fkFromReferenced.referencedCols)
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CurrentFkDerivation extends FkDerivation<TableRelationship, Column> {
  override constructFk(
    fkToReferencing: TableRelationship,
    fkFromReferenced: TableRelationship,
    newRelReferencing: Column[]
  ): TableRelationship {
    return new TableRelationship(
      new Relationship(
        newRelReferencing,
        Array.from(fkFromReferenced.referencedCols)
      ),
      fkToReferencing.referencing,
      fkFromReferenced.referenced
    );
  }
}
