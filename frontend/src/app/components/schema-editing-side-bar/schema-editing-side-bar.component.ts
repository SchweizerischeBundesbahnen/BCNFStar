import Schema from '@/src/model/schema/Schema';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
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
import { SbbPageEvent } from '@sbb-esta/angular/pagination';
import Column from '@/src/model/schema/Column';
import { FdCluster } from '@/src/model/types/FdCluster';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import IndScore from '@/src/model/schema/methodObjects/IndScore';

@Component({
  selector: 'app-schema-editing-side-bar',
  templateUrl: './schema-editing-side-bar.component.html',
  styleUrls: ['./schema-editing-side-bar.component.css'],
})
export class SchemaEditingSideBarComponent implements OnChanges {
  @Input() public table!: Table;
  @Input() public schema!: Schema;
  @Output() public deleteColumnEvent = new EventEmitter<Column>();
  @Output() public splitFd = new EventEmitter<FunctionalDependency>();
  @Output() public indToFk = new EventEmitter<SourceRelationship>();
  @Output() public selectColumns = new EventEmitter<
    Map<Table, ColumnCombination>
  >();
  @Output() public setSurrogateKey = new EventEmitter<string>();

  @ViewChild('indSelection', { read: SbbRadioGroup })
  private indSelectionGroup!: SbbRadioGroup;

  public _fdClusterFilter = new Array<Column>();
  public indFilter = new Array<Table>();

  public page: number = 0;
  public pageSize = 5;

  public surrogateKey = '';

  ngOnChanges(): void {
    console.log(this.table);
    this._fdClusterFilter = [];
    this.indFilter = Array.from(this.schema.tables);
    this.surrogateKey = this.table ? this.table.surrogateKey : '';
  }

  public selectedInd(): SourceRelationship | undefined {
    if (!this.indSelectionGroup) return undefined;
    return this.indSelectionGroup.value;
  }

  public emitHighlightedInd(rel: SourceRelationship) {
    const map = new Map<Table, ColumnCombination>();
    for (const tableRel of this.schema.indsOf(this.table).get(rel)!) {
      if (!map.has(tableRel.referencing)) {
        map.set(tableRel.referencing, new ColumnCombination());
      }
      if (!map.has(tableRel.referenced)) {
        map.set(tableRel.referenced, new ColumnCombination());
      }
      map
        .get(tableRel.referencing)!
        .union(new ColumnCombination(tableRel.relationship.referencing));
      map
        .get(tableRel.referenced)!
        .union(new ColumnCombination(tableRel.relationship.referenced));
    }
    this.selectColumns.emit(map);
  }
  public emitHighlightedCluster(cluster: FdCluster) {
    const map = new Map<Table, ColumnCombination>();
    map.set(this.table, cluster.columns);
    this.selectColumns.emit(map);
  }

  public changePage(evt: SbbPageEvent) {
    this.page = evt.pageIndex;
  }

  public get fdClusterFilter(): ColumnCombination {
    return new ColumnCombination(this._fdClusterFilter);
  }

  public fdClusters(): Array<FdCluster> {
    const cc = this.fdClusterFilter;
    return this.table
      .fdClusters()
      .filter((cluster) => cc.isSubsetOf(cluster.columns));
  }

  public inds(): Array<SourceRelationship> {
    const inds = this.schema.indsOf(this.table);

    return Array.from(inds.keys())
      .filter((sourceRel) =>
        inds
          .get(sourceRel)!
          .some((ind) => this.indFilter.includes(ind.referenced))
      )
      .sort((sourceRel1, sourceRel2) => {
        const score1 = new IndScore(
          inds.get(sourceRel1)![0].relationship
        ).get();
        const score2 = new IndScore(
          inds.get(sourceRel2)![0].relationship
        ).get();
        return score2 - score1;
      });
  }

  public addSurrogateKey(): void {
    console.log(this.table.surrogateKey);
  }

  public transformIndToFk(): void {
    const ind = this.selectedInd();
    if (!ind) return;
    this.indToFk.emit(ind);
  }
}
