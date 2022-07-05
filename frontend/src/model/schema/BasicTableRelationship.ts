import BasicColumn from '../types/BasicColumn';
import BasicTable from './BasicTable';

export default interface BasicTableRelationship {
  referencingTable: BasicTable;
  referencingCols: Array<BasicColumn>;
  referencingName: string;

  referencedTable: BasicTable;
  referencedCols: Array<BasicColumn>;
  referencedName: string;
}
