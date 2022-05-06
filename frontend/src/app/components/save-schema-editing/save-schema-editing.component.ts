import AutoNormalizeCommand from '@/src/model/commands/AutoNormalizeCommand';
import CommandProcessor from '@/src/model/commands/CommandProcessor';
import IndToFkCommand from '@/src/model/commands/IndToFkCommand';
import JoinCommand from '@/src/model/commands/JoinCommand';
import SplitCommand from '@/src/model/commands/SplitCommand';
import TableRenameCommand from '@/src/model/commands/TableRenameCommand';
import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import FunctionalDependency from '@/src/model/schema/FunctionalDependency';
import Relationship from '@/src/model/schema/Relationship';
import Schema from '@/src/model/schema/Schema';
import SourceColumn from '@/src/model/schema/SourceColumn';
import SourceFunctionalDependency from '@/src/model/schema/SourceFunctionalDependency';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import SourceTable from '@/src/model/schema/SourceTable';
import SourceTableInstance from '@/src/model/schema/SourceTableInstance';
import Table from '@/src/model/schema/Table';
import { TableRelationship } from '@/src/model/types/TableRelationship';
import { Component, Input } from '@angular/core';
import superjson from 'superjson';

interface JSONSchema {
  tables: Array<JSONTable>;
  _fks: Array<JSONSourceRelationship>;
  _inds: Array<JSONSourceRelationship>;
  _fds: Array<{
    key: JSONSourceTable;
    value: Array<JSONSourceFunctionalDependency>;
  }>;
}

interface JSONSourceFunctionalDependency {
  lhs: Array<JSONSourceColumn>;
  rhs: Array<JSONSourceColumn>;
}

interface JSONSourceRelationship {
  referencing: Array<JSONSourceColumn>;
  referenced: Array<JSONSourceColumn>;
}

interface JSONTable {
  name: string;
  schemaName: string;
  columns: JSONColumnCombination;
  pk?: JSONColumnCombination;
  fds: Array<JSONFunctionalDependency>;
  relationships: Array<JSONRelationship>;
  sources: Array<JSONSourceTableInstance>;
  _violatingFds?: Array<JSONFunctionalDependency>;
  _keys?: Array<JSONColumnCombination>;
  _splittableFdClusters: Array<{
    columns: JSONColumnCombination;
    fds: Array<JSONFunctionalDependency>;
  }>;
  _fks: Array<JSONTableRelationship>;
  _inds: Array<{
    key: JSONSourceRelationship;
    value: Array<JSONTableRelationship>;
  }>;
  _relationshipsValid: boolean;
}

interface JSONTableRelationship {
  relationship: JSONRelationship;
  referencing: JSONTable;
  referenced: JSONTable;
}

interface JSONRelationship {
  _referencing: Array<JSONColums>;
  _referenced: Array<JSONColums>;
  _score: number;
}

interface JSONFunctionalDependency {
  lhs: JSONColumnCombination;
  rhs: JSONColumnCombination;
  _score: number;
}

interface JSONColumnCombination {
  _columns: Array<JSONColums>;
}

interface JSONColums {
  sourceTableInstance: JSONSourceTableInstance;
  sourceColumn: JSONSourceColumn;
  alias?: string;
}

interface JSONSourceTableInstance {
  id: number;
  useId: boolean;
  table: JSONSourceTable;
  customAlias?: string;
}

interface JSONSourceColumn {
  name: string;
  table: JSONSourceTable;
  dataType: string;
  ordinalPosition: number;
  nullable: boolean;
}

interface JSONSourceTable {
  name: string;
  schemaName: string;
}

@Component({
  selector: 'app-save-schema-editing',
  templateUrl: './save-schema-editing.component.html',
  styleUrls: ['./save-schema-editing.component.css'],
})
export class SaveSchemaEditingComponent {
  @Input() public schema!: Schema;
  @Input() public commandProcessor!: CommandProcessor;
  constructor() {}

  public filename: string = '';

  public testFile: any;

  public saveEditedSchema() {
    console.log(this.schema);
    this.registerClassesForSuperjson();
    let schemaJSONFile = '';
    // let commandProcessorJSONFile = '';
    try {
      // schemaJSONFile = superjson.serialize(this.schema);
      // commandProcessorJSONFile = superjson.serialize(this.commandProcessor);
      schemaJSONFile = JSON.stringify(this.schema);
      // console.log(schemaJSONFile);
      // console.log(commandProcessorJSONFile);
      this.testFile = schemaJSONFile;
    } catch (e) {
      console.error(e);
    }
  }

  public getSchema() {
    let schemaObject: JSONSchema = JSON.parse(this.testFile);

    console.log('schemaObjec: ', schemaObject);
    console.log('schema', this.parseSchema(schemaObject));
  }

  private parseSchema(schema: JSONSchema) {
    let newSchema: Schema = new Schema(...this.parseTableArray(schema.tables));
    this.parseSourceRelationshipArray(schema._fks).forEach((fk) => {
      newSchema.addFk(fk);
    });
    this.parseSourceRelationshipArray(schema._inds).forEach((ind) => {
      newSchema.addInd(ind);
    });
    this.parseTableFds(schema._fds).forEach((sfd) => {
      newSchema.addFd(sfd);
    });
    return newSchema;
  }

  private parseTableFds(
    fds: Array<{
      key: JSONSourceTable;
      value: Array<JSONSourceFunctionalDependency>;
    }>
  ) {
    let newSourceFunctionalDependencies =
      new Array<SourceFunctionalDependency>();
    fds.forEach((fd) => {
      newSourceFunctionalDependencies.push(
        ...this.parseSourceFunctionalDependencyArray(fd.value)
      );
    });
    return newSourceFunctionalDependencies;
  }

  private parseSourceFunctionalDependencyArray(
    sfda: Array<JSONSourceFunctionalDependency>
  ) {
    let newSourceFunctionalDependencies =
      new Array<SourceFunctionalDependency>();
    sfda.forEach((sfd) => {
      newSourceFunctionalDependencies.push(
        this.parseSourceFunctionalDependency(sfd)
      );
    });
    return newSourceFunctionalDependencies;
  }

  private parseSourceFunctionalDependency(sfd: JSONSourceFunctionalDependency) {
    return new SourceFunctionalDependency(
      this.parseSourceColumnArray(sfd.lhs),
      this.parseSourceColumnArray(sfd.rhs)
    );
  }

  private parseTableArray(tables: Array<JSONTable>) {
    let newTables = new Array<Table>();
    tables.forEach((table) => {
      newTables.push(this.parseTable(table));
    });
    return newTables;
  }

  private parseTable(table: JSONTable) {
    let newTable = new Table();
    newTable.name = table.name;
    newTable.schemaName = table.schemaName;

    newTable.columns = this.parseColumnCombination(table.columns);
    if (table.pk && table.pk._columns.length > 0)
      newTable.pk = this.parseColumnCombination(table.pk);

    let newFds = new Array<FunctionalDependency>();
    table.fds.forEach((fd) => {
      newFds.push(this.parseFunctionalDependency(fd));
    });
    newTable.fds = newFds;

    let newRelationships = new Array<Relationship>();
    table.relationships.forEach((relationship) => {
      newRelationships.push(this.parseRelationship(relationship));
    });
    newTable.relationships = newRelationships;

    let newSources = new Array<SourceTableInstance>();
    table.sources.forEach((source) => {
      newSources.push(this.parseSourceTableInstance(source));
    });
    newTable.sources = newSources;

    if (table._violatingFds) newTable.violatingFds();
    if (table._keys) newTable.keys();

    if (table._splittableFdClusters) {
      let newSplittableFdClusters = new Array<{
        columns: ColumnCombination;
        fds: Array<FunctionalDependency>;
      }>();
      table._splittableFdClusters.forEach((cluster) => {
        let newFds = new Array<FunctionalDependency>();
        cluster.fds.forEach((fd) => {
          newFds.push(this.parseFunctionalDependency(fd));
        });
        newSplittableFdClusters.push({
          columns: this.parseColumnCombination(cluster.columns),
          fds: newFds,
        });
      });
      newTable._splittableFdClusters = newSplittableFdClusters;
    }

    let newFks = new Array<TableRelationship>();
    table._fks.forEach((fk) => {
      newFks.push(this.parseTableRelationship(fk));
    });
    newTable._fks = newFks;

    if (table._inds.length > 0) {
      newTable._inds = this.parseTableInds(table._inds);
    }

    newTable._relationshipsValid = table._relationshipsValid;

    return newTable;
  }

  private parseTableInds(
    inds: Array<{
      key: JSONSourceRelationship;
      value: Array<JSONTableRelationship>;
    }>
  ) {
    let newMap = new Map<SourceRelationship, Array<TableRelationship>>();
    inds.forEach((ind) => {
      newMap.set(
        this.parseSourceRelationship(ind.key),
        this.parseTableRelationshipArray(ind.value)
      );
    });
    return newMap;
  }

  private parseSourceRelationship(sr: JSONSourceRelationship) {
    let newSourceRelationship = new SourceRelationship();
    newSourceRelationship.referenced = this.parseSourceColumnArray(
      sr.referenced
    );
    newSourceRelationship.referencing = this.parseSourceColumnArray(
      sr.referencing
    );
    return newSourceRelationship;
  }

  private parseTableRelationshipArray(tra: Array<JSONTableRelationship>) {
    let newTableRelationships = new Array<TableRelationship>();
    tra.forEach((tr) => {
      newTableRelationships.push(this.parseTableRelationship(tr));
    });
    return newTableRelationships;
  }

  private parseTableRelationship(tr: JSONTableRelationship) {
    return {
      relationship: this.parseRelationship(tr.relationship),
      referencing: this.parseTable(tr.referencing),
      referenced: this.parseTable(tr.referenced),
    } as TableRelationship;
  }

  private parseRelationship(relationship: JSONRelationship) {
    let newReferencingColumns: Array<Column> = [];
    relationship._referencing.forEach((col) => {
      newReferencingColumns.push(this.parseColumn(col));
    });
    let newReferencing = newReferencingColumns;

    let newReferencedColumns: Array<Column> = [];
    relationship._referenced.forEach((col) => {
      newReferencedColumns.push(this.parseColumn(col));
    });
    let newReferenced = newReferencedColumns;

    let newRelationship = new Relationship(newReferencing, newReferenced);
    if (relationship._score) newRelationship._score = relationship._score;

    return newRelationship;
  }

  private parseFunctionalDependency(fd: JSONFunctionalDependency) {
    let newLhs = this.parseColumnCombination(fd.lhs);
    let newRhs = this.parseColumnCombination(fd.rhs);
    let newFd = new FunctionalDependency(newLhs, newRhs);
    if (fd._score) newFd._score = fd._score;

    return newFd;
  }

  private parseColumnCombination(cc: JSONColumnCombination) {
    let newColumns: Array<Column> = [];
    cc._columns.forEach((col) => {
      newColumns.push(this.parseColumn(col));
    });
    return new ColumnCombination(newColumns);
  }

  private parseColumn(col: JSONColums) {
    this.parseSourceTableInstance(col.sourceTableInstance);
    return new Column(
      this.parseSourceTableInstance(col.sourceTableInstance),
      this.parseSourceColumn(col.sourceColumn),
      col.alias
    );
  }

  private parseSourceColumnArray(asc: Array<JSONSourceColumn>) {
    let newSourceColumns = Array<SourceColumn>();
    asc.forEach((sc) => {
      newSourceColumns.push(this.parseSourceColumn(sc));
    });
    return newSourceColumns;
  }

  private parseSourceColumn(sc: JSONSourceColumn) {
    let newSourceTable = new SourceTable(sc.table.name, sc.table.schemaName);
    return new SourceColumn(
      sc.name,
      newSourceTable,
      sc.dataType,
      sc.ordinalPosition,
      sc.nullable
    );
  }

  private parseSourceTableInstance(sti: JSONSourceTableInstance) {
    let newSourceTable = new SourceTable(sti.table.name, sti.table.schemaName);
    let newSourceTableInstance = new SourceTableInstance(
      newSourceTable,
      sti.customAlias
    );
    newSourceTableInstance.id = sti.id;
    newSourceTableInstance.useId = sti.useId;
    return newSourceTableInstance;
  }

  private parseSourceRelationshipArray(sra: Array<JSONSourceRelationship>) {
    let newSourceRelationships = new Array<SourceRelationship>();
    sra.forEach((sr) => {
      newSourceRelationships.push(this.parseSourceRelationship(sr));
    });
    return newSourceRelationships;
  }

  private registerClassesForSuperjson() {
    superjson.registerClass(Column);
    superjson.registerClass(ColumnCombination);
    superjson.registerClass(FunctionalDependency);
    superjson.registerClass(Relationship);
    superjson.registerClass(Schema);
    superjson.registerClass(SourceColumn);
    superjson.registerClass(SourceFunctionalDependency);
    superjson.registerClass(SourceRelationship);
    superjson.registerClass(SourceTable);
    superjson.registerClass(SourceTableInstance);
    superjson.registerClass(Table);
    // superjson.registerClass(TableRelationship);

    superjson.registerClass(AutoNormalizeCommand);
    superjson.registerClass(CommandProcessor);
    superjson.registerClass(IndToFkCommand);
    superjson.registerClass(JoinCommand);
    superjson.registerClass(SplitCommand);
    superjson.registerClass(TableRenameCommand);
  }
}
