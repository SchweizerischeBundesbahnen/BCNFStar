import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { SbbRadioGroup } from '@sbb-esta/angular-core/radio-button';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent {
  @ViewChild(SbbRadioGroup) fdSelectionGroup!: SbbRadioGroup;
  @Input() table?: Table;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();
  @Output() persistSchema = new EventEmitter<string>();

  schemaName: string = '';

  constructor() {}

  selectedFd(): FunctionalDependency | undefined {
    if (!this.fdSelectionGroup) return undefined;
    return this.fdSelectionGroup.value;
  }

  onInputChange(value: Event): void {
    this.schemaName = (value.target! as HTMLInputElement).value;
  }

  splitSelectedFd(): void {
    this.splitFd.emit(this.selectedFd()!);
  }
}
