import { ConstraintPolicy } from './ConstraintPolicy';

/**
 * Containes the necessary information to display an object as a column in the schema graph
 */
export default interface BasicColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  dataTypeString: string;
  persistedNullConstraint(constraintPolicy: ConstraintPolicy): boolean;
}

export function surrogateKeyColumn(name: string): BasicColumn {
  return {
    name: name,
    dataType: 'integer',
    nullable: false,
    dataTypeString: '(integer, not null)',
    persistedNullConstraint: (constraintPolicy: ConstraintPolicy) =>
      constraintPolicy == 'minimal',
  };
}

export function newBasicColumn(
  name: string,
  dataType: string,
  nullable: boolean
): BasicColumn {
  return {
    name: name,
    dataType: dataType,
    nullable: nullable,
    dataTypeString: `(${dataType}, ${nullable ? 'null' : 'not null'})`,
    persistedNullConstraint: (constraintPolicy: ConstraintPolicy) =>
      constraintPolicy == 'minimal' || nullable,
  };
}
