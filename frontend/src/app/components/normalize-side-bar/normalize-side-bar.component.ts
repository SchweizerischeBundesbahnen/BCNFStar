import Relationship from '@/src/model/schema/Relationship';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
export class NormalizeSideBarComponent implements OnChanges {
  @ViewChild('fdSelection', { read: SbbRadioGroup })
  fdSelectionGroup!: SbbRadioGroup;
  @ViewChild('indSelection', { read: SbbRadioGroup })
  indSelectionGroup!: SbbRadioGroup;
  @Input() table?: Table;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();
  @Output() indToFk = new EventEmitter<{
    source: Table;
    target: Table;
    relationship: Relationship;
  }>();
  public fds!: Array<FunctionalDependency>;
  public inds!: Array<{ relationship: Relationship; table: Table }>;

  constructor() {}

  ngOnChanges(): void {
    this.fds = this.table?.violatingFds() || [];
    this.inds = this.table?.inds().filter((x) => x.table != this.table) || [];
  }

  selectedFd(): FunctionalDependency | undefined {
    if (!this.fdSelectionGroup) return undefined;
    return this.fdSelectionGroup.value;
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
