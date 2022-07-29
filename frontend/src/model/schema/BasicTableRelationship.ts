import BasicColumn from '../types/BasicColumn';
import BasicTable from './BasicTable';

/**
 * A generalisation of TableRelationship. It can be used to display and persist foreign key relationships between any type of table.
 * Because of this generalisation basicTableRelationships cannot always be used for a join.
 */
export default interface BasicTableRelationship {
  referencingTable: BasicTable;
  referencingCols: Array<BasicColumn>;
  referencingName: string;

  referencedTable: BasicTable;
  referencedCols: Array<BasicColumn>;
  referencedName: string;
}
