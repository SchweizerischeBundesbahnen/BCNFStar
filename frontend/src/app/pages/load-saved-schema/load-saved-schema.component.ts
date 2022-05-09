import { Component } from '@angular/core';
import SourceColumn from '@/src/model/schema/SourceColumn';
import SourceFunctionalDependency from '@/src/model/schema/SourceFunctionalDependency';
import SourceRelationship from '@/src/model/schema/SourceRelationship';
import SourceTable from '@/src/model/schema/SourceTable';
import SourceTableInstance from '@/src/model/schema/SourceTableInstance';
import Table from '@/src/model/schema/Table';
import Column from '@/src/model/schema/Column';
import ColumnCombination from '@/src/model/schema/ColumnCombination';
import Relationship from '@/src/model/schema/Relationship';
import Schema from '@/src/model/schema/Schema';
import { DatabaseService } from '../../database.service';
import { Router } from '@angular/router';

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
  // fds: Array<JSONFunctionalDependency>;
  relationships: Array<JSONRelationship>;
  sources: Array<JSONSourceTableInstance>;
}

interface JSONRelationship {
  _referencing: Array<JSONColums>;
  _referenced: Array<JSONColums>;
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
  selector: 'app-load-saved-schema',
  templateUrl: './load-saved-schema.component.html',
  styleUrls: ['./load-saved-schema.component.css'],
})
export class LoadSavedSchemaComponent {
  public newSchema = new Schema();
  public savedSchemas: Map<string, string> = new Map<string, string>();

  constructor(public dataService: DatabaseService, public router: Router) {
    Object.keys(localStorage).forEach((key) => {
      if (localStorage.getItem(key))
        this.savedSchemas.set(key, localStorage.getItem(key)!);
    });
    // console.log(this.savedSchemas);
  }

  public deleteAll() {
    localStorage.clear();
    window.location.reload();
  }

  public getSchema(savedSchemaEntry: string) {
    // console.log(savedSchemaEntry)
    let schemaObject: JSONSchema = JSON.parse(savedSchemaEntry);
    this.parseSchema(schemaObject);
    this.dataService.schema = this.newSchema;
    this.router.navigate(['/edit-schema']);
    // console.log(this.existingSourceTables)
    // console.log(this.existingSourceColumns)
    // console.log(this.existingSourceTableInstances)
    // console.log(this.existingSourceRelationships)
    // console.log(this.existingSourceFunctionalDependencies)
  }

  private parseSchema(schema: JSONSchema) {
    this.newSchema = new Schema(...this.parseTableArray(schema.tables));
    this.parseSourceRelationshipArray(schema._fks).forEach((fk) => {
      this.newSchema.addFk(fk);
    });
    this.parseSourceRelationshipArray(schema._inds).forEach((ind) => {
      this.newSchema.addInd(ind);
    });
    this.parseTableFds(schema._fds).forEach((sfd) => {
      this.newSchema.addFd(sfd);
    });
    console.log('schema', this.newSchema);
    this.newSchema.tables.forEach((table) => {
      this.newSchema.calculateFdsOf(table);
    });
  }

  private existingSourceTables = new Set<SourceTable>();
  private existingSourceColumns = new Set<SourceColumn>();
  private existingSourceTableInstances = new Set<SourceTableInstance>();
  private existingSourceRelationships = new Set<SourceRelationship>();
  private existingSourceFunctionalDependencies =
    new Set<SourceFunctionalDependency>();

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

    // let newFds = new Array<FunctionalDependency>();
    // table.fds.forEach((fd) => {
    //   newFds.push(this.parseFunctionalDependency(fd));
    // });
    // newTable.fds = newFds;

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

    return newTable;
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

  private parseSourceTableInstance(sti: JSONSourceTableInstance) {
    let newSourceTable = new SourceTable(sti.table.name, sti.table.schemaName);
    if (
      Array.from(this.existingSourceTables).filter((ele) =>
        ele.equals(newSourceTable)
      ).length > 0
    ) {
      newSourceTable = Array.from(this.existingSourceTables).find((ele) =>
        ele.equals(newSourceTable)
      )!;
    } else {
      this.existingSourceTables.add(newSourceTable);
    }

    let newSourceTableInstance = new SourceTableInstance(
      newSourceTable,
      sti.customAlias
    );
    newSourceTableInstance.id = sti.id;
    newSourceTableInstance.useId = sti.useId;

    if (
      Array.from(this.existingSourceTableInstances).filter((ele) =>
        ele.equals(newSourceTableInstance)
      ).length > 0
    ) {
      newSourceTableInstance = Array.from(
        this.existingSourceTableInstances
      ).find((ele) => ele.equals(newSourceTableInstance))!;
    } else {
      this.existingSourceTableInstances.add(newSourceTableInstance);
    }

    return newSourceTableInstance;
  }

  private parseSourceColumn(sc: JSONSourceColumn) {
    let newSourceTable = new SourceTable(sc.table.name, sc.table.schemaName);
    if (
      Array.from(this.existingSourceTables).filter((ele) =>
        ele.equals(newSourceTable)
      ).length > 0
    ) {
      newSourceTable = Array.from(this.existingSourceTables).find((ele) =>
        ele.equals(newSourceTable)
      )!;
    } else {
      this.existingSourceTables.add(newSourceTable);
    }

    let newSourceColumn = new SourceColumn(
      sc.name,
      newSourceTable,
      sc.dataType,
      sc.ordinalPosition,
      sc.nullable
    );
    if (
      Array.from(this.existingSourceColumns).filter((ele) =>
        ele.equals(newSourceColumn)
      ).length > 0
    ) {
      newSourceColumn = Array.from(this.existingSourceColumns).find((ele) =>
        ele.equals(newSourceColumn)
      )!;
    } else {
      this.existingSourceColumns.add(newSourceColumn);
    }

    return newSourceColumn;
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

  private parseSourceRelationshipArray(sra: Array<JSONSourceRelationship>) {
    let newSourceRelationships = new Array<SourceRelationship>();
    sra.forEach((sr) => {
      newSourceRelationships.push(this.parseSourceRelationship(sr));
    });
    return newSourceRelationships;
  }

  private parseSourceRelationship(sr: JSONSourceRelationship) {
    let newSourceRelationship = new SourceRelationship();
    newSourceRelationship.referenced = this.parseSourceColumnArray(
      sr.referenced
    );
    newSourceRelationship.referencing = this.parseSourceColumnArray(
      sr.referencing
    );
    if (
      Array.from(this.existingSourceRelationships).filter((ele) =>
        ele.equals(newSourceRelationship)
      ).length > 0
    ) {
      newSourceRelationship = Array.from(this.existingSourceRelationships).find(
        (ele) => ele.equals(newSourceRelationship)
      )!;
    } else {
      this.existingSourceRelationships.add(newSourceRelationship);
    }
    return newSourceRelationship;
  }

  private parseSourceColumnArray(asc: Array<JSONSourceColumn>) {
    let newSourceColumns = Array<SourceColumn>();
    asc.forEach((sc) => {
      newSourceColumns.push(this.parseSourceColumn(sc));
    });
    return newSourceColumns;
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
    let newSourceFunctionalDependency = new SourceFunctionalDependency(
      this.parseSourceColumnArray(sfd.lhs),
      this.parseSourceColumnArray(sfd.rhs)
    );
    if (
      Array.from(this.existingSourceFunctionalDependencies).filter((ele) =>
        ele.equals(newSourceFunctionalDependency)
      ).length > 0
    ) {
      newSourceFunctionalDependency = Array.from(
        this.existingSourceFunctionalDependencies
      ).find((ele) => ele.equals(newSourceFunctionalDependency))!;
    } else {
      this.existingSourceFunctionalDependencies.add(
        newSourceFunctionalDependency
      );
    }
    return newSourceFunctionalDependency;
  }
}
