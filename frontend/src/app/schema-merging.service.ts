import { Injectable } from '@angular/core';
import { SbbDialog } from '@sbb-esta/angular/dialog';
import { firstValueFrom } from 'rxjs';
import Column from '../model/schema/Column';
import Schema from '../model/schema/Schema';
import Table from '../model/schema/Table';
import { LinkDefinition } from './components/graph/schema-graph/schema-graph.component';
import { UnionDialogComponent } from './components/union/union-dialog/union-dialog.component';
import { IntegrationService } from './integration.service';
import { generateButtonMarkup } from './pages/schema-editing/schema-editing.component';
import { SchemaService } from './schema.service';

import * as joint from 'jointjs';
import BasicTable from '../model/schema/BasicTable';
@Injectable({
  providedIn: 'root',
})
export class SchemaMergingService {
  constructor(
    private schemaService: SchemaService,
    private intService: IntegrationService,
    private dialog: SbbDialog
  ) {}

  get isMerging() {
    return !!this.combinedSchema;
  }

  public get tables() {
    return this.combinedSchema?.tables!;
  }

  public get links(): Array<LinkDefinition> {
    return this.intService.links
      .filter(
        (linkDef) =>
          this.combinedSchema?.tables.has(linkDef.source.table) &&
          this.combinedSchema?.tables.has(linkDef.target.table)
      )
      .map((linkDef) => {
        const button: Partial<LinkDefinition> = {
          tool: new joint.dia.ToolsView({
            tools: [
              new joint.linkTools.Button({
                markup: generateButtonMarkup('join-button', '#006400', 'U'),
                distance: '50%',
                action: () =>
                  this.union([
                    linkDef.source.table as Table,
                    linkDef.target.table as Table,
                  ]),
              }),
            ],
          }),
        };
        return Object.assign(button, linkDef);
      });
  }

  private combinedSchema?: Schema;
  private oldSchemas?: [Schema, Schema];
  startMerging(schemas?: [Schema, Schema]) {
    if (schemas) this.oldSchemas = schemas;
    else this.oldSchemas = this.intService.schemas!;
    this.schemaService.notifyAboutSchemaChanges();
    this.intService.stopIntegration();
    this.combinedSchema = this.oldSchemas[0].merge(this.oldSchemas[1]);
    this.schemaService.schema = this.combinedSchema;
  }

  public async union(tables: [Table, Table]) {
    const dialogRef = this.dialog.open(UnionDialogComponent, {
      data: { tables },
    });
    const result: {
      columns: Array<Array<Column | null>>;
      newTableName: string;
    } = await firstValueFrom(dialogRef.afterClosed());

    this.schemaService.union({
      tables,
      columns: result.columns,
      newTableName: result.newTableName,
    });
  }

  public availableTablesFor(table?: BasicTable): Array<Table> {
    if (!table || !(table instanceof Table)) return [];
    return (
      this.oldSchemas?.find((s) => !s.tables.has(table))?.regularTables ?? []
    );
  }

  public cancel() {
    this.intService.startIntegration(this.oldSchemas![0], this.oldSchemas![1]);
    this.complete();
  }

  public complete() {
    delete this.combinedSchema;
    delete this.oldSchemas;
    this.schemaService.notifyAboutSchemaChanges();
  }
}
