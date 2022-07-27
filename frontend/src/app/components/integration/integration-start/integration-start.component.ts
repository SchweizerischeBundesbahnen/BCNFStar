import Schema from '@/src/model/schema/Schema';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IntegrationService } from '../../../integration.service';

@Component({
  selector: 'app-integration-start',
  templateUrl: './integration-start.component.html',
  styleUrls: ['./integration-start.component.css'],
})
export class IntegrationStartComponent {
  public leftSchema?: Schema;
  public rightSchema?: Schema;

  private thesaurus?: string;
  constructor(private intService: IntegrationService, private router: Router) {}

  async onThesaurusChanged(files: Array<File>) {
    if (files.length) this.thesaurus = await files[0].text();
    else this.thesaurus = undefined;
  }

  startIntegration() {
    if (!this.leftSchema || !this.rightSchema) return;
    this.intService.startIntegration(
      this.leftSchema,
      this.rightSchema,
      this.thesaurus
    );
    this.router.navigate(['/edit-schema']);
  }
}
