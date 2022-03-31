import Relationship from '../schema/Relationship';
import Table from '../schema/Table';

export interface TableRelationship {
  relationship: Relationship;
  table: Table;
}
