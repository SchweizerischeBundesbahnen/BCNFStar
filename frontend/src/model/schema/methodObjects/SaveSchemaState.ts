import { FkDisplayOptions } from '../../types/FkDisplayOptions';
import Column from '../Column';
import ColumnCombination from '../ColumnCombination';
import Relationship from '../Relationship';
import Schema from '../Schema';
import SourceColumn from '../SourceColumn';
import SourceFunctionalDependency from '../SourceFunctionalDependency';
import SourceRelationship from '../SourceRelationship';
import SourceTable from '../SourceTable';
import SourceTableInstance from '../SourceTableInstance';
import Table from '../Table';
import TableRelationship from '../TableRelationship';
import UnionedTable from '../UnionedTable';

interface JSONSchema {
  regularTables: Array<JSONTable>;
  unionedTables: Array<JSONUnionedTable>;
  _baseFks: Array<JSONSourceRelationship>;
  _tableFks: Array<[JSONTableRelationship, FkDisplayOptions]>;
  _inds: Array<JSONSourceRelationship>;
  _fds: Array<JSONSourceFunctionalDependency>;
}

interface JSONSourceFunctionalDependency {
  lhs: Array<JSONSourceColumn>;
  rhs: Array<JSONSourceColumn>;
}

interface JSONSourceRelationship {
  _referencingCols: Array<JSONSourceColumn>;
  _referencedCols: Array<JSONSourceColumn>;
}

interface JSONTableRelationship {
  relationship: JSONRelationship;
  referencing: string;
  referenced: string;
}

interface JSONTable {
  name: string;
  schemaName: string;
  columns: JSONColumnCombination;
  pk?: JSONColumnCombination;
  sk: string;
  relationships: Array<JSONRelationship>;
  sources: Array<JSONSourceTableInstance>;
  rowCount: number;
  fds: Array<JSONFunctionalDependencies>;
}

interface JSONFunctionalDependencies {
  lhs: JSONColumnCombination;
  rhs: JSONColumnCombination;
  _redundantTuples: number;
  _uniqueTuplesLhs: number;
}

interface JSONUnionedTable {
  name: string;
  schemaName: string;
  tables: [JSONTable, JSONTable];
  columns: [Array<JSONColumn | null>, Array<JSONColumn | null>];
  rPriority: Array<boolean>;
}

interface JSONRelationship {
  _referencing: Array<JSONColumn>;
  _referenced: Array<JSONColumn>;
  _score: number;
}

interface JSONColumnCombination {
  _columns: Array<JSONColumn>;
}

interface JSONColumn {
  sourceTableInstance: JSONSourceTableInstance;
  sourceColumn: JSONSourceColumn;
  userAlias?: string;
  includeSourceName: boolean;
  _maxValue: number;
  _bloomFilterExpectedFpp: number;
}

interface JSONSourceTableInstance {
  table: JSONSourceTable;
  userAlias?: string;
  id: number;
  useId: boolean;
}

interface JSONSourceColumn {
  name: string;
  table: JSONSourceTable;
  dataType: string;
  nullable: boolean;
}

interface JSONSourceTable {
  name: string;
  schemaName: string;
  rowCount: number;
}

export default class SaveSchemaState {
  private newSchema: Schema = new Schema();
  constructor() {}

  public parseSchema(schema: JSONSchema) {
    this.newSchema.addTables(...this.parseTableArray(schema.regularTables));
    this.newSchema.addTables(
      ...schema.unionedTables.map((table) => this.parseUnionedTable(table))
    );
    this.newSchema.addFks(
      ...this.parseSourceRelationshipArray(schema._baseFks)
    );
    this.newSchema.addInds(...this.parseSourceRelationshipArray(schema._inds));
    this.parseTableFds(schema._fds).forEach((sfd) => {
      this.newSchema.addFd(sfd);
    });
    this.newSchema.regularTables.forEach((table) => {
      this.newSchema.calculateFdsOf(table);
    });
    schema.regularTables.forEach((table) => {
      this.parseFdsRankingAttributes(table);
    });
    this.newSchema.updateFks(
      this.parseTableFks(
        schema._tableFks,
        Array.from(this.newSchema.regularTables)
      )
    );
    return this.newSchema;
  }

  private parseFdsRankingAttributes(table: JSONTable) {
    const parsedTable = this.parseTable(table);
    let existingTable = this.newSchema.regularTables.find(
      (t) =>
        t.schemaName == parsedTable.schemaName &&
        t.name == parsedTable.name &&
        parsedTable.sources.every((source) =>
          t.sources.find((other) => other.equals(source))
        ) &&
        t.columns.equals(parsedTable.columns) &&
        (!t.pk && !parsedTable.pk ? true : t.pk!.equals(parsedTable.pk!)) &&
        t.surrogateKey == parsedTable.surrogateKey &&
        t.rowCount == parsedTable.rowCount &&
        parsedTable.relationships.every((rel) =>
          t.relationships.find((other) => other.equals(rel))
        )
    );
    if (existingTable) {
      table.fds.forEach((fd) => {
        let existingFd = existingTable!.fds.find(
          (f) =>
            f.lhs.equals(this.parseColumnCombination(fd.lhs, existingTable!)) &&
            f.rhs.equals(this.parseColumnCombination(fd.rhs, existingTable!))
        );
        if (existingFd) {
          existingFd._redundantTuples = fd._redundantTuples;
          existingFd._uniqueTuplesLhs = fd._uniqueTuplesLhs;
        } else {
          console.log(
            'no fd found, ranking attributes could not be parsed',
            'JSONTable: ' + table,
            'parsedTable: ' + parsedTable,
            'tables of new schema: ' + this.newSchema.regularTables
          );
        }
      });
    } else {
      console.log(
        'no table ranking attributes could not be parsed',
        table,
        parsedTable,
        this.newSchema.regularTables
      );
    }
  }

  private parseTableFks(
    tableFks: Array<[JSONTableRelationship, FkDisplayOptions]>,
    tables: Array<Table>
  ): Map<TableRelationship, FkDisplayOptions> {
    const result = new Map<TableRelationship, FkDisplayOptions>();
    for (const [tableFk, displayOptions] of tableFks) {
      const referencingTable = tables.find(
        (table) => table.fullName == tableFk.referencing
      )!;
      const referencedTable = tables.find(
        (table) => table.fullName == tableFk.referenced
      )!;
      const newTableFk = new TableRelationship(
        this.parseRelationship(
          tableFk.relationship,
          referencingTable,
          referencedTable
        ),
        referencingTable,
        referencedTable
      );
      result.set(newTableFk, displayOptions);
    }
    return result;
  }

  private existingSourceTables = new Array<SourceTable>();
  private existingSourceColumns = new Array<SourceColumn>();
  private existingSourceRelationships = new Array<SourceRelationship>();
  private existingColumnsForTable = new Map<Table, Array<Column>>();

  private parseTableArray(tables: Array<JSONTable>) {
    let newTables = new Array<Table>();
    tables.forEach((table) => {
      newTables.push(this.parseTable(table));
    });
    return newTables;
  }

  private parseUnionedTable(table: JSONUnionedTable) {
    const parsedTables = table.tables.map((table) => this.parseTable(table));
    const parsedColumns = table.columns.map((columns, i) =>
      columns.map((column) => {
        if (column === null) return null;
        return this.parseColumn(column, parsedTables[i]);
      })
    );
    const newTable = new UnionedTable(
      parsedTables[0],
      parsedColumns[0],
      parsedTables[1],
      parsedColumns[1]
    );
    newTable.schemaName = table.schemaName;
    newTable.name = table.name;
    newTable.rPriority = table.rPriority;
    return newTable;
  }

  private parseTable(jsonTable: JSONTable) {
    let table = new Table();
    this.existingColumnsForTable.set(table, []);

    table.name = jsonTable.name;
    table.schemaName = jsonTable.schemaName;

    table.sources = jsonTable.sources.map((source) =>
      this.parseSourceTableInstance(source)
    );

    table.columns = this.parseColumnCombination(jsonTable.columns, table);

    if (jsonTable.pk && jsonTable.pk._columns.length > 0)
      table.pk = this.parseColumnCombination(jsonTable.pk, table);

    table.surrogateKey = jsonTable.sk;

    let newRelationships = new Array<Relationship>();
    jsonTable.relationships.forEach((relationship) => {
      newRelationships.push(this.parseRelationship(relationship, table, table));
    });
    table.relationships = newRelationships;
    table.rowCount = jsonTable.rowCount;
    table.calculateColumnMatching();

    return table;
  }

  private parseColumnCombination(cc: JSONColumnCombination, newTable: Table) {
    let newColumns = cc._columns.map((col) => this.parseColumn(col, newTable));
    return new ColumnCombination(newColumns);
  }

  private parseColumn(col: JSONColumn, table: Table): Column {
    let column = new Column(
      this.findSourceTableInstance(col.sourceTableInstance, table.sources),
      this.parseSourceColumn(col.sourceColumn),
      col.userAlias
    );
    column.includeSourceName = col.includeSourceName;
    column.bloomFilterExpectedFpp = col._bloomFilterExpectedFpp;
    column.maxValue = col._maxValue;
    let existing = this.existingColumnsForTable
      .get(table)!
      .find((other) => other.equals(column));
    if (existing) {
      return existing;
    } else {
      this.existingColumnsForTable.get(table)!.push(column);
      return column;
    }
  }

  private parseSourceTableInstance(sti: JSONSourceTableInstance) {
    let newSourceTable = new SourceTable(sti.table.name, sti.table.schemaName);

    let existing = this.existingSourceTables.find((other) =>
      other.equals(newSourceTable)
    );
    if (existing) {
      newSourceTable = existing;
    } else {
      this.existingSourceTables.push(newSourceTable);
    }

    let newSourceTableInstance = new SourceTableInstance(
      newSourceTable,
      sti.userAlias
    );
    newSourceTableInstance.id = sti.id;
    newSourceTableInstance.useId = sti.useId;

    return newSourceTableInstance;
  }

  private findSourceTableInstance(
    sti: JSONSourceTableInstance,
    existingSourceTableInstances: Array<SourceTableInstance>
  ): SourceTableInstance {
    return existingSourceTableInstances.find((other) =>
      other.equals(this.parseSourceTableInstance(sti))
    )!;
  }

  private parseSourceColumn(sc: JSONSourceColumn) {
    let newSourceTable = new SourceTable(sc.table.name, sc.table.schemaName);

    let existingTab = this.existingSourceTables.find((other) =>
      other.equals(newSourceTable)
    );
    if (existingTab) {
      newSourceTable = existingTab;
    } else {
      this.existingSourceTables.push(newSourceTable);
    }

    let newSourceColumn = new SourceColumn(
      sc.name,
      newSourceTable,
      sc.dataType,
      sc.nullable
    );

    let existingCol = this.existingSourceColumns.find((other) =>
      other.equals(newSourceColumn)
    );
    if (existingCol) {
      newSourceColumn = existingCol;
    } else {
      this.existingSourceColumns.push(newSourceColumn);
    }

    return newSourceColumn;
  }

  private parseRelationship(
    relationship: JSONRelationship,
    referencingTable: Table,
    referencedTable: Table
  ) {
    let newReferencingColumns: Array<Column> = [];
    relationship._referencing.forEach((col) => {
      newReferencingColumns.push(this.parseColumn(col, referencingTable));
    });
    let newReferencing = newReferencingColumns;

    let newReferencedColumns: Array<Column> = [];
    relationship._referenced.forEach((col) => {
      newReferencedColumns.push(this.parseColumn(col, referencedTable));
    });
    let newReferenced = newReferencedColumns;

    let newRelationship = new Relationship(newReferencing, newReferenced);
    if (relationship._score) newRelationship._score = relationship._score;

    return newRelationship;
  }

  private parseSourceRelationshipArray(
    sourceRelationships: Array<JSONSourceRelationship>
  ) {
    return sourceRelationships.map((sourceRelationship) =>
      this.parseSourceRelationship(sourceRelationship)
    );
  }

  private parseSourceRelationship(sr: JSONSourceRelationship) {
    let newSourceRelationship = new SourceRelationship(
      this.parseSourceColumnArray(sr._referencingCols),
      this.parseSourceColumnArray(sr._referencedCols)
    );

    let existing = this.existingSourceRelationships.find((other) =>
      other.equals(newSourceRelationship)
    );
    if (existing) {
      newSourceRelationship = existing;
    } else {
      this.existingSourceRelationships.push(newSourceRelationship);
    }
    return newSourceRelationship;
  }

  private parseSourceColumnArray(sourceColumns: Array<JSONSourceColumn>) {
    return sourceColumns.map((sourceColumn) =>
      this.parseSourceColumn(sourceColumn)
    );
  }

  private parseTableFds(fds: Array<JSONSourceFunctionalDependency>) {
    return fds.map((fd) => this.parseSourceFunctionalDependency(fd));
  }

  private parseSourceFunctionalDependency(sfd: JSONSourceFunctionalDependency) {
    return new SourceFunctionalDependency(
      this.parseSourceColumnArray(sfd.lhs),
      this.parseSourceColumnArray(sfd.rhs)
    );
  }
}
