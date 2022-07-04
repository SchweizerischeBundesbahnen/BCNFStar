import { IntegrationService, Side } from '@/src/app/integration.service';
import { SchemaService } from '@/src/app/schema.service';
import { Component } from '@angular/core';
import { SbbRadioChange } from '@sbb-esta/angular/radio-button';

@Component({
  selector: 'app-integration-bar',
  templateUrl: './integration-bar.component.html',
  styleUrls: ['./integration-bar.component.css'],
})
export class IntegrationBarComponent {
  constructor(
    private intService: IntegrationService,
    private schemaService: SchemaService
  ) {}

  public changedMode(mode: SbbRadioChange) {
    if (mode.value === 'compare') {
      this.intService.isComparing = true;
    } else {
      this.intService.isComparing = false;
      this.intService.currentlyEditedSide =
        mode.value === 'left' ? Side.left : Side.right;
    }
  }
}
