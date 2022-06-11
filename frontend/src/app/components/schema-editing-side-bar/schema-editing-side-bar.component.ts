import { Component } from '@angular/core';
import { SchemaService } from '../../schema.service';

@Component({
  selector: 'app-schema-editing-side-bar',
  templateUrl: './schema-editing-side-bar.component.html',
  styleUrls: ['./schema-editing-side-bar.component.css'],
})
export class SchemaEditingSideBarComponent {
  constructor(public schemaService: SchemaService) {}
  get table() {
    return this.schemaService.selectedTable!;
  }
}
