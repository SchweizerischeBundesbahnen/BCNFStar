import Schema from '@/src/model/schema/Schema';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IntegrationService } from '../../integration.service';

@Component({
  selector: 'app-integration-start',
  templateUrl: './integration-start.component.html',
  styleUrls: ['./integration-start.component.css'],
})
export class IntegrationStartComponent {
  public newSchema?: Schema;
  public existingSchema?: Schema;
  constructor(private intService: IntegrationService, private router: Router) {}

  startIntegration() {
    if (!this.newSchema || !this.existingSchema) return;
    this.intService.startIntegration(this.newSchema, this.existingSchema);
    this.router.navigate(['/matching']);
  }
}
