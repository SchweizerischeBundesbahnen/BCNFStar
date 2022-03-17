import { IndService } from '@/src/app/ind.service';
import ColumnCombination from '../schema/ColumnCombination';
import Relationship from '../schema/Relationship';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class IndToFkCommand extends Command {
  schema: Schema;
  relationship: Relationship;
  referencing: Table;
  referenced: Table;
  formerPk?: ColumnCombination;
  indService: IndService;

  public constructor(
    indService: IndService,
    schema: Schema,
    relationship: Relationship,
    referencing: Table,
    referenced: Table
  ) {
    super();
    this.indService = indService;
    this.schema = schema;
    this.relationship = relationship;
    this.referencing = referencing;
    this.referenced = referenced;
  }

  protected override _do(): void {
    this.formerPk = this.referenced.pk;
    this.schema.fkRelationships.add(this.relationship);
    this.referenced.pk = this.relationship.referenced();
    this.indService.changeInd(this.referencing.inds());
  }

  protected override _undo(): void {
    this.schema.fkRelationships.delete(this.relationship);
    this.referenced.pk = this.formerPk;
    this.indService.changeInd(this.referencing.inds());
  }

  protected override _redo(): void {
    this.schema.fkRelationships.add(this.relationship);
    this.referenced.pk = this.relationship.referenced();
    this.indService.changeInd(this.referencing.inds());
  }
}
