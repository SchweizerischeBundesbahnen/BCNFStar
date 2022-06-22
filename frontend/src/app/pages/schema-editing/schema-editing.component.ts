import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SchemaGraphComponent } from '../../components/graph/schema-graph/schema-graph.component';
import Table from '@/src/model/schema/Table';

import { SchemaService } from '../../schema.service';

@Component({
  selector: 'app-schema-editing',
  templateUrl: './schema-editing.component.html',
  styleUrls: ['./schema-editing.component.css'],
})
export class SchemaEditingComponent {
  @ViewChild(SchemaGraphComponent, { static: true })
  public graph!: SchemaGraphComponent;

  constructor(router: Router, public schemaService: SchemaService) {
    if (!schemaService.hasSchema) router.navigate(['']);
  }

  public get selectedTableAsTable() {
    return this.schemaService.selectedTable as Table;
  }
}
