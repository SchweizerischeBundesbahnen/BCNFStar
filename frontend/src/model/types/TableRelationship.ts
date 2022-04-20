import Relationship from '../schema/Relationship';
import Table from '../schema/Table';

/**
 * These objects describe a relationship between two different tables.
 * It contains all information to uniquely identify all columns involved in the relationship across the schema.
 */
export interface TableRelationship {
  /**
   * Note that the referencing columns are part of the referencing table and analagous for referenced.
   * Be careful when using the relationship without the context of the respective tables.
   */
  relationship: Relationship;
  referencing: Table;
  referenced: Table;
}
