import { IntegrationService, Side } from '@/src/app/integration.service';
import { AfterViewInit, Component } from '@angular/core';
import { SbbRadioChange } from '@sbb-esta/angular/radio-button';

@Component({
  selector: 'app-integration-bar',
  templateUrl: './integration-bar.component.html',
  styleUrls: ['./integration-bar.component.css'],
})
export class IntegrationBarComponent implements AfterViewInit {
  constructor(private intService: IntegrationService) {}

  ngAfterViewInit(): void {
    // color the toggle items in the respective schema's color
    // this has to be done like this because the required label html
    // tags are created by sbb angular and don't exist in our html
    for (const side of ['left', 'right'])
      document
        .querySelector(`sbb-toggle-option.integration-${side} > label`)
        ?.classList.add(`integration-${side}`);
  }

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
