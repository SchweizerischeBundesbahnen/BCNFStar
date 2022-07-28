import { IntegrationService } from '@/src/app/integration.service';
import Table from '@/src/model/schema/Table';
import { Component, Input, OnInit } from '@angular/core';
import { SchemaService } from '../../../schema.service';

@Component({
  selector: 'app-union-sidebar',
  templateUrl: './union-sidebar.component.html',
  styleUrls: ['./union-sidebar.component.css'],
})
export class UnionSidebarComponent implements OnInit {
  public otherTable?: Table;

  @Input() availableTables!: Array<Table>;

  constructor(
    public schemaService: SchemaService,
    public intService: IntegrationService
  ) {}

  ngOnInit(): void {
    return;
  }

  get table() {
    return this.schemaService.selectedTable as Table;
  }

  public filteredTables(): Array<Table> {
    return this.availableTables.filter((t) => t !== this.table);
  }
}
