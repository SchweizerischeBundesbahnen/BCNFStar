import Schema from '@/src/model/schema/Schema';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import matchSchemas from '@/src/model/schema/SchemaMatching';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { MatchingViewerComponent } from '../matching-viewer/matching-viewer.component';

@Component({
  selector: 'app-schema-editing-side-bar',
  templateUrl: './schema-editing-side-bar.component.html',
  styleUrls: ['./schema-editing-side-bar.component.css'],
})
export class SchemaEditingSideBarComponent {
  @Input() public table!: Table;
  @Input() public schema!: Schema;
  @Output() public splitFd = new EventEmitter<FunctionalDependency>();
  @Output() public indToFk = new EventEmitter<SourceRelationship>();
  @Output() public selectColumns = new EventEmitter<
    Map<Table, ColumnCombination>
  >();
  @Output() public autoNormalizeSelectedTable = new EventEmitter();

  constructor(private dialog: SbbDialog) {}

  public matchExamples() {
    const types: Record<string, string> = {
      Pno: 'int',
      Pname: 'string',
      Dept: 'string',
      Born: 'date',
      EmpNo: 'int',
      EmpName: 'varchar(50)',
      DeptNo: 'int',
      Salary: 'dec(15,2)',
      Birthdate: 'date',
      DeptName: 'varchar(70)',
    };
    const sLeftT1 = Table.fromColumnNames(
      ['Pno', 'Pname', 'Dept', 'Born'],
      'Personnel'
    );
    sLeftT1.pk = new ColumnCombination(sLeftT1.columns.columnsFromNames('Pno'));
    const exampleLeft = new Schema(sLeftT1);
    const sRightT1 = Table.fromColumnNames(
      ['EmpNo', 'EmpName', 'DeptNo', 'Salary', 'Birthdate'],
      'Employee'
    );
    const sRightT2 = Table.fromColumnNames(
      ['DeptNo', 'DeptName'],
      'Department'
    );
    sRightT1.pk = new ColumnCombination(
      sRightT1.columns.columnsFromNames('EmpNo')
    );
    sRightT2.pk = new ColumnCombination(
      sRightT2.columns.columnsFromNames('DeptNo')
    );
    for (const table of [sLeftT1, sRightT1, sRightT2])
      for (const col of table.columns)
        col.sourceColumn.dataType = types[col.name];
    const exampleRight = new Schema(sRightT1, sRightT2);
    exampleRight.addFks(new SourceRelationship());

    this.matchSchemas(exampleRight, exampleLeft);
  }

  public matchSchemas(schema: Schema, otherSchema = this.schema) {
    const matching = matchSchemas([...otherSchema.tables], [...schema.tables]);
    console.log(matching);
    console.log(Object.keys(matching).length);
    this.dialog.open(MatchingViewerComponent, {
      data: { matching },
    });
  }
}
