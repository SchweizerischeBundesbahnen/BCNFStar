import { IndRankingService } from '@/src/app/ind-ranking.service';
import { SchemaService } from '@/src/app/schema.service';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
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
  private indRankingService: IndRankingService = new IndRankingService();

  constructor(public schemaService: SchemaService) {
    this.schemaService.schemaChanged.subscribe(() => {
      this.indFilter = this.tablesAsArray();
    });
  }

  public get table() {
    return this.schemaService.selectedTable as Table;
  }

  public get schema() {
    return this.schemaService.schema!;
  }

  public selectedInd(): SourceRelationship | undefined {
    return this.indSelectionGroup?.value;
  }

  public setHighlightedInd(rel: SourceRelationship) {
    const map = new Map<Table, ColumnCombination>();
    for (const tableRel of this.schemaService.schema
      .indsOf(this.table)
      .get(rel)!) {
      if (!map.has(tableRel.referencingTable)) {
        map.set(tableRel.referencingTable, new ColumnCombination());
      }
      if (!map.has(tableRel.referencedTable)) {
        map.set(tableRel.referencedTable, new ColumnCombination());
      }
      map
        .get(tableRel.referencingTable)!
        .union(new ColumnCombination(tableRel.referencingCols));
      map
        .get(tableRel.referencedTable)!
        .union(new ColumnCombination(tableRel.referencedCols));
    }
    this.schemaService.highlightedColumns = map;
  }

  public tablesAsArray() {
    return [...this.schemaService.schema.regularTables];
  }

  public inds(): Array<SourceRelationship> {
    const inds = this.schemaService.schema.indsOf(this.table);

    let ar = Array.from(inds.keys()).filter((sourceRel) =>
      inds
        .get(sourceRel)!
        .some((ind) => this.indFilter.includes(ind.referencedTable))
    );
    this.indRankingService.rankTableRelationships(ar);

    return ar;

    // .sort((sourceRel1, sourceRel2) => {
    //   const score1 = new IndScore(
    //     inds.get(sourceRel1)![0].relationship
    //   ).get();
    //   const score2 = new IndScore(
    //     inds.get(sourceRel2)![0].relationship
    //   ).get();
    //   return score2 - score1;
    // });
  }

  public transformIndToFk(): void {
    const ind = this.selectedInd();
    if (ind) this.schemaService.indToFk(ind);
  }
}
