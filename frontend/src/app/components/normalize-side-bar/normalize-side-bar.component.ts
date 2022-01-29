import Relationship from '@/src/model/schema/Relationship';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { SbbRadioGroup } from '@sbb-esta/angular/radio-button';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent {
  @ViewChild('fdSelection', { read: SbbRadioGroup })
  fdSelectionGroup!: SbbRadioGroup;
  @ViewChild('indSelection', { read: SbbRadioGroup })
  indSelectionGroup!: SbbRadioGroup;
  @Input() table?: Table;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();
  @Output() persistSchema = new EventEmitter<string>();
  @Output() download = new EventEmitter();

  schemaName: string = '';
  @Output() joinInd = new EventEmitter<{
    source: Table;
    target: Table;
    relationship: Relationship;
  }>();

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

  selectedInd(): [Relationship, Table] | undefined {
    if (!this.indSelectionGroup) return undefined;
    return this.indSelectionGroup.value;
  }

  joinSelectedInd(): void {
    this.joinInd.emit({
      source: this.table!,
      target: this.selectedInd()![1],
      relationship: this.selectedInd()![0],
    });
  }
}
