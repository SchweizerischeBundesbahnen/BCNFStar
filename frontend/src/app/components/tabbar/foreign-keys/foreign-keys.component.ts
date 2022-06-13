import { SchemaService } from '@/src/app/schema.service';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import IndScore from '@/src/model/schema/methodObjects/IndScore';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import Table from '@/src/model/schema/Table';
import { Component, ViewChild } from '@angular/core';
import { SbbRadioGroup } from '@sbb-esta/angular/radio-button';

@Component({
  selector: 'app-foreign-keys',
  templateUrl: './foreign-keys.component.html',
  styleUrls: ['./foreign-keys.component.css'],
})
export class ForeignKeysComponent {
  public indFilter = this.tablesAsArray();
  @ViewChild('indSelection', { read: SbbRadioGroup })
  private indSelectionGroup!: SbbRadioGroup;

  constructor(public schemaService: SchemaService) {
    this.schemaService.schemaChanged.subscribe(() => {
      this.indFilter = this.tablesAsArray();
    });
  }

  public get table() {
    return this.schemaService.selectedTable!;
  }

  public selectedInd(): SourceRelationship | undefined {
    return this.indSelectionGroup?.value;
  }

  public setHighlightedInd(rel: SourceRelationship) {
    const map = new Map<Table, ColumnCombination>();
    for (const tableRel of this.schemaService.schema
      .indsOf(this.table)
      .get(rel)!) {
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
    this.schemaService.highlightedColumns = map;
  }

  public tablesAsArray() {
    return [...this.schemaService.schema.tables];
  }

  public inds(): Array<SourceRelationship> {
    const inds = this.schemaService.schema.indsOf(this.table);

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
    if (ind) this.schemaService.indToFk(ind);
  }
}
