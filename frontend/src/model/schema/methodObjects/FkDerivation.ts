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

/**
 * Uses existingRels to calculate all valid relationships by transitively extending them.
 */
export abstract class FkDerivation<
  RelType extends IRel<RelType, ColType>,
  ColType extends Comparable<ColType>
> {
  public result: Array<RelType>;

  constructor(public existingRels: Array<RelType>, public fk: RelType) {
    this.result = [fk];
    const fksToReferencing = this.existingRels.filter((otherRel) =>
      otherRel.isConnected(fk)
    );
    const fksFromReferenced = this.existingRels.filter((otherRel) =>
      fk.isConnected(otherRel)
    );
    fksToReferencing.push(fk);
    fksFromReferenced.push(fk);
    for (const fkToReferencing of fksToReferencing) {
      for (const fkFromReferenced of fksFromReferenced) {
        if (fkToReferencing == fkFromReferenced) continue;
        const newRelReferencing = new Array<ColType>();
        for (const referencedCol of fkFromReferenced.referencingCols) {
          const i = fkToReferencing.referencedCols.findIndex(
            (referencingCol) => {
              if (fkToReferencing == fk || fkFromReferenced == fk)
                return referencingCol.equals(referencedCol);
              else return fk.mapsColumns(referencingCol, referencedCol);
            }
          );
          if (i == -1) break;
          newRelReferencing.push(fkToReferencing.referencingCols[i]);
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

export class SourceFkDerivation extends FkDerivation<
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

export class TableFkDerivation extends FkDerivation<TableRelationship, Column> {
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
      fkToReferencing.referencingTable,
      fkFromReferenced.referencedTable
    );
  }
}
