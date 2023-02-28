import Schema from '@/src/model/schema/Schema';
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IntegrationService } from '../../integration.service';
import { SchemaMergingService } from '../../schema-merging.service';
import { SchemaService } from '../../schema.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(
    private schemaService: SchemaService,
    private router: Router
  ) {}

  public setSchemaAndGo(schema: Schema) {
    this.schemaService.schema = schema;
    this.router.navigate(['/edit-schema']);
  }
}
