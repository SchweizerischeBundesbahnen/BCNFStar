import Relationship from '@/src/model/schema/Relationship';
import Schema from '@/src/model/schema/Schema';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { SbbRadioGroup } from '@sbb-esta/angular/radio-button';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';
import { SbbPageEvent } from '@sbb-esta/angular/pagination';

@Component({
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent implements OnChanges, OnInit {
  @ViewChild('indSelection', { read: SbbRadioGroup })
  indSelectionGroup!: SbbRadioGroup;
  @Input() table!: Table;
  @Input() schema!: Schema;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();

  public tableName: string = '';
  page: number = 0;
  pageSize = 5;
  @Output() indToFk = new EventEmitter<{
    source: Table;
    target: Table;
    relationship: Relationship;
  }>();

  @Output() selectColumns = new EventEmitter<ColumnCombination>();
  @Output() renameTable = new EventEmitter<{
    table: Table;
    newName: string;
  }>();

  ngOnInit(): void {
    this.tableName = this.table.name;
  }

  ngOnChanges(): void {
    this.editingName = false;
  }

  selectedInd(): { relationship: Relationship; table: Table } | undefined {
    if (!this.indSelectionGroup) return undefined;
    return this.indSelectionGroup.value;
  }

  public editingName = false;
  setTableName() {
    this.renameTable.emit({
      table: this.table,
      newName: this.tableName,
    });
    this.editingName = false;
  }
  changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
  }

  transformIndToFk(): void {
    this.indToFk.emit({
      source: this.table!,
      target: this.selectedInd()!.table,
      relationship: this.selectedInd()!.relationship,
    });
  }
}
