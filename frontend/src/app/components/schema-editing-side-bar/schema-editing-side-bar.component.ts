import Schema from '@/src/model/schema/Schema';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import Table from 'src/model/schema/Table';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import matchSchemas from '@/src/model/schema/SchemaMatching';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { MatchingViewerComponent } from '../matching-viewer/matching-viewer.component';
import { Component } from '@angular/core';
import { SchemaService } from '../../schema.service';

@Component({
  selector: 'app-schema-editing-side-bar',
  templateUrl: './schema-editing-side-bar.component.html',
  styleUrls: ['./schema-editing-side-bar.component.css'],
})
export class SchemaEditingSideBarComponent {
  constructor(private dialog: SbbDialog, public schemaService: SchemaService) {}

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

  public matchSchemas(schema: Schema, otherSchema = this.schemaService.schema) {
    const matching = matchSchemas([...otherSchema.tables], [...schema.tables]);
    console.log(matching);
    console.log(Object.keys(matching).length);
    this.dialog.open(MatchingViewerComponent, {
      data: { matching },
    });
  }
  get table() {
    return this.schemaService.selectedTable!;
  }
}
