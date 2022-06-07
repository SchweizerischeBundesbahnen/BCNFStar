import ColumnCombination from '@/src/model/schema/ColumnCombination';
import IndScore from '@/src/model/schema/methodObjects/IndScore';
import Schema from '@/src/model/schema/Schema';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import Table from '@/src/model/schema/Table';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { SbbRadioGroup } from '@sbb-esta/angular/radio-button';

@Component({
  selector: 'app-foreign-keys',
  templateUrl: './foreign-keys.component.html',
  styleUrls: ['./foreign-keys.component.css'],
})
export class ForeignKeysComponent implements OnChanges {
  @Input() public schema!: Schema;
  @Input() public table!: Table;
  @Output() public selectColumns = new EventEmitter<
    Map<Table, ColumnCombination>
  >();
  @Output() public indToFk = new EventEmitter<SourceRelationship>();
  public indFilter = new Array<Table>();
  @ViewChild('indSelection', { read: SbbRadioGroup })
  private indSelectionGroup!: SbbRadioGroup;

  constructor() {}

  ngOnChanges(): void {
    this.indFilter = this.schema.regularTables;
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

  public tablesAsArray() {
    return [...this.schema.tables];
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

  public transformIndToFk(): void {
    const ind = this.selectedInd();
    if (!ind) return;
    this.indToFk.emit(ind);
  }
}
