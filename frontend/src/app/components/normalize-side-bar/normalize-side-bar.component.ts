import Relationship from '@/src/model/schema/Relationship';
import Schema from '@/src/model/schema/Schema';
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
  @Input() table!: Table;
  @Input() schema!: Schema;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();

  schemaName: string = '';
  @Output() indToFk = new EventEmitter<{
    source: Table;
    target: Table;
    relationship: Relationship;
  }>();

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

  selectedInd(): { relationship: Relationship; table: Table } | undefined {
    if (!this.indSelectionGroup) return undefined;
    return this.indSelectionGroup.value;
  }

  transformIndToFk(): void {
    this.indToFk.emit({
      source: this.table!,
      target: this.selectedInd()!.table,
      relationship: this.selectedInd()!.relationship,
    });
  }
}
