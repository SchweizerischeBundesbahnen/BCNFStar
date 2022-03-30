import Relationship from '@/src/model/schema/Relationship';
import Schema from '@/src/model/schema/Schema';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
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
import { SbbPageEvent } from '@sbb-esta/angular/pagination';

import { SbbSelectChange } from '@sbb-esta/angular/select';
import { OnInit } from '@angular/core';
@Component({
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent implements OnInit {
  @ViewChild('indSelection', { read: SbbRadioGroup })
  indSelectionGroup!: SbbRadioGroup;
  @Input() table!: Table;
  @Input() schema!: Schema;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();

  schemaName: string = '';
  inds: { relationship: Relationship; table: Table }[] = [];
  clusters: Array<{
    columns: ColumnCombination;
    fds: Array<FunctionalDependency>;
  }> = [];
  page: number = 0;
  pageSize = 5;

  ngOnInit(): void {
    this.clusters = this.schema.splittableFdClustersOf(this.table);
    this.inds = this.schema.indsOf(this.table);
  }
  @Output() indToFk = new EventEmitter<{
    source: Table;
    target: Table;
    relationship: Relationship;
  }>();

  @Output() selectColumns = new EventEmitter<ColumnCombination>();

  selectedInd(): { relationship: Relationship; table: Table } | undefined {
    if (!this.indSelectionGroup) return undefined;
    return this.indSelectionGroup.value;
  }

  changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
  }

  filterClusters(event: SbbSelectChange) {
    const cc = new ColumnCombination(...event.value);
    this.clusters = this.schema
      .splittableFdClustersOf(this.table)
      .filter((c) => cc.isSubsetOf(c.columns));
  }

  filterInds(event: SbbSelectChange) {
    const tables: Array<Table> = event.value;
    console.log(tables);
    this.inds = this.schema
      .indsOf(this.table)
      .filter((r) => tables.includes(r.table));
  }

  transformIndToFk(): void {
    this.indToFk.emit({
      source: this.table!,
      target: this.selectedInd()!.table,
      relationship: this.selectedInd()!.relationship,
    });
  }
}
