import Schema from '@/src/model/schema/Schema';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import Column from '@/src/model/schema/Column';

@Component({
  selector: 'app-schema-editing-side-bar',
  templateUrl: './schema-editing-side-bar.component.html',
  styleUrls: ['./schema-editing-side-bar.component.css'],
})
export class SchemaEditingSideBarComponent {
  @Input() public table!: Table;
  @Input() public schema!: Schema;
  @Output() public setSurrogateKey = new EventEmitter<string>();
  @Output() public deleteColumnEvent = new EventEmitter<Column>();
  @Output() public splitFd = new EventEmitter<FunctionalDependency>();
  @Output() public indToFk = new EventEmitter<SourceRelationship>();
  @Output() public selectColumns = new EventEmitter<
    Map<Table, ColumnCombination>
  >();
  @Output() public autoNormalizeSelectedTable = new EventEmitter();

  constructor() {}
}
