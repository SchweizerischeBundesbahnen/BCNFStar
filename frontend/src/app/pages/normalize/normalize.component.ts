import { SchemaService } from 'src/app/schema.service';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { Component } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { DatabaseService } from 'src/app/database.service';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent {
  inputTable: Table;
  tables: Array<Table> = [];
  selectedTable?: Table;

  constructor(public schemaService: SchemaService) {
    this.inputTable = schemaService.inputTable!;
    this.onInputTableChanged();
  }

  onInputTableChanged(): void {
    this.tables = this.inputTable.allResultingTables();
  }

  onSelect(table: Table): void {
    this.selectedTable = table;
  }

  onSplitFd(fd: FunctionalDependency): void {
    this.selectedTable!.split(fd);
    this.onInputTableChanged();
    this.selectedTable = this.selectedTable!.children[0];
  }
  /*
export class NormalizeComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private dataService: DatabaseService
  ) {}

  tableName = '';
  functionalDependencies: string[] = [];

  ngOnInit(): void {
    this.tableName = this.route.snapshot.paramMap.get('table_name') || '';
    this.functionalDependencies =
      this.dataService.getFunctionalDependenciesByTableName(this.tableName);
  }
*/
}
