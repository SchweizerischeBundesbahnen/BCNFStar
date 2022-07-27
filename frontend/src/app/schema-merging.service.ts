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
    const coveredTables: Map<BasicTable, Set<BasicTable>> = new Map();

    /**
     * Checks whether a union button exists already for this pair of tables
     * If not, markss this pair as covered now as well
     */
    const isNotCoveredYet = (linkDef: LinkDefinition) => {
      if (coveredTables.get(linkDef.source.table)?.has(linkDef.target.table))
        return false;
      if (!coveredTables.has(linkDef.source.table))
        coveredTables.set(linkDef.source.table, new Set());
      coveredTables.get(linkDef.source.table)?.add(linkDef.target.table);
      return true;
    };

    return this.intService.links
      .filter(
        (linkDef) =>
          this.combinedSchema?.tables.has(linkDef.source.table) &&
          this.combinedSchema?.tables.has(linkDef.target.table)
      )
      .map((linkDef) => {
        if (isNotCoveredYet(linkDef))
          linkDef.tool = new joint.dia.ToolsView({
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
          });

        return linkDef;
      });
  }

  private combinedSchema?: Schema;
  startMerging() {
    const combinedSchema = this.intService.schemas![0].merge(
      this.intService.schemas![1]
    );
    this.schemaService.doPlainCommand(
      () => {
        this.intService.stopIntegration();
        this.schemaService.schema = this.combinedSchema = combinedSchema;
      },
      () => {
        this.intService.startIntegration(
          this.intService.schemas![0],
          this.intService.schemas![1]
        );
        delete this.combinedSchema;
      }
    );
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
      this.intService.schemas?.find((s) => !s.tables.has(table))
        ?.regularTables ?? []
    );
  }

  public cancel() {
    const combinedSchema = this.combinedSchema;
    this.schemaService.doPlainCommand(
      () => {
        this.intService.startIntegration(
          this.intService.schemas![0],
          this.intService.schemas![1]
        );
        delete this.combinedSchema;
      },
      () => {
        this.intService.stopIntegration();
        this.combinedSchema = combinedSchema;
      }
    );
  }

  public complete() {
    const combinedSchema = this.combinedSchema;
    this.schemaService.doPlainCommand(
      () => {
        delete this.combinedSchema;
      },
      () => {
        this.combinedSchema = combinedSchema;
      }
    );
  }
}
