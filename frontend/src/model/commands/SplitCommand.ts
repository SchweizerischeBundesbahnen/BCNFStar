import FunctionalDependency from '../schema/FunctionalDependency';
import Relationship from '../schema/Relationship';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class SplitCommand extends Command {
  schema: Schema;
  table: Table;
  fd: FunctionalDependency;
  relationship?: Relationship;
  children?: Array<Table>;

  public constructor(schema: Schema, table: Table, fd: FunctionalDependency) {
    super();
    this.schema = schema;
    this.table = table;
    this.fd = fd;
  }

  protected override _do(): void {
    this.children = this.schema.split(this.table, this.fd);
    this.relationship = this.schema.fkRelationshipBetween(
      this.children[0],
      this.children[1]
    );
  }

  protected override _undo(): void {
    this.schema.delete(...this.children!);
    this.schema.add(this.table);
    this.schema.fkRelationships.delete(this.relationship!);
  }

  protected override _redo(): void {
    this.schema.delete(this.table);
    this.schema.add(...this.children!);
    this.schema.fkRelationships.add(this.relationship!);
  }
}
