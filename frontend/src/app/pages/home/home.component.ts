import Schema from '@/src/model/schema/Schema';
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IntegrationService } from '../../integration.service';
import { SchemaService } from '../../schema.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(
    private schemaService: SchemaService,
    private intService: IntegrationService,
    private router: Router
  ) {
    // reset edited schema and integration when going to home page
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        if (evt.url === '') {
          this.intService.stopIntegration();
          this.schemaService.hasSchema = false;
        }
      }
    });
  }

  public setSchemaAndGo(schema: Schema) {
    this.schemaService.schema = schema;
    this.router.navigate(['/edit-schema']);
  }
}
