import BasicTable from '../BasicTable';
import Schema from '../Schema';

export default class PotentialFacts {
  public potentialFacts = new Set<BasicTable>();

  private static weightDirect = 1;
  private static weightIndirect = 0.8;
  private static k = 1.0;

  private connectionTopologyValues = new Map<BasicTable, number>();

  public constructor(private schema: Schema) {
    for (const table of this.schema.tables) this.calculateCTVOf(table);
    const ctvs = Array.from(this.connectionTopologyValues.values());
    const n = this.schema.tables.size;
    const mean = ctvs.reduce((a, b) => a + b) / n;
    const std = Math.sqrt(
      ctvs.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
    );
    const threshold = mean + PotentialFacts.k * std;
    for (const table of this.schema.tables)
      if (this.connectionTopologyValues.get(table)! >= threshold)
        this.potentialFacts.add(table);
  }

  private calculateCTVOf(
    table: BasicTable,
    visitedTables: Array<BasicTable> = []
  ): number {
    if (visitedTables.includes(table)) return 0;
    if (!this.connectionTopologyValues.has(table)) {
      let ctv =
        PotentialFacts.weightDirect * this.schema.fksOf(table, true).length;
      for (const fk of this.schema.fksOf(table, true))
        ctv +=
          PotentialFacts.weightIndirect *
          this.calculateCTVOf(fk.referencedTable, [...visitedTables, table]);
      this.connectionTopologyValues.set(table, ctv);
    }
    return this.connectionTopologyValues.get(table)!;
  }
}
