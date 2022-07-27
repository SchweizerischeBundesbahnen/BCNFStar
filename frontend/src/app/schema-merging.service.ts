import { Injectable } from '@angular/core';
import Schema from '../model/schema/Schema';
import Table from '../model/schema/Table';
import { LinkDefinition } from './components/graph/schema-graph/schema-graph.component';
import { IntegrationService } from './integration.service';
import { generateButtonMarkup } from './pages/schema-editing/schema-editing.component';
import { SchemaService } from './schema.service';

import * as joint from 'jointjs';
import BasicTable from '../model/schema/BasicTable';

/**
 * This service coordinates the schema merging phase of the integration mode.
 * It takes two schemas, which should be already aligned (have equivalent tables and columns)
 * and aides the user in unioning them.
 *
 * It also creates tables and connections between them (links) for the schema graph while
 * in the merging phase.
 */
@Injectable({
  providedIn: 'root',
})
export class SchemaMergingService {
  constructor(
    private schemaService: SchemaService,
    private intService: IntegrationService
  ) {}

  /** The schema being workedd on in the merging phase.
   * Initially, this just contains all data from both input schemas,
   * but over time the user unions the tables in this schema.
   */
  private combinedSchema?: Schema;

  get isMerging() {
    return !!this.combinedSchema;
  }

  public get tables() {
    return this.combinedSchema?.tables!;
  }

  /**
   * Links to be displayed in merging phase. These are the same links
   * as in the integration service, except every connected table pair
   * gets a union button on one link
   */
  public get links(): Array<LinkDefinition> {
    const coveredTables: Map<BasicTable, Set<BasicTable>> = new Map();

    /**
     * Checks whether a union button exists already for this pair of tables
     * If not, marks this pair as covered now as well
     */
    const isAlreadyCovered = (linkDef: LinkDefinition) => {
      if (coveredTables.get(linkDef.source.table)?.has(linkDef.target.table))
        return true;
      if (!coveredTables.has(linkDef.source.table))
        coveredTables.set(linkDef.source.table, new Set());
      coveredTables.get(linkDef.source.table)?.add(linkDef.target.table);
      return false;
    };

    return (
      this.intService.links
        // filter out connections between tables that don't exist anymore because
        // they have been unioned
        .filter(
          (linkDef) =>
            this.combinedSchema?.tables.has(linkDef.source.table) &&
            this.combinedSchema?.tables.has(linkDef.target.table)
        )
        // add union button if pair doesn't have a union button, otherwise don't modify
        .map((linkDef) => {
          if (isAlreadyCovered(linkDef)) return linkDef;
          linkDef.tool = new joint.dia.ToolsView({
            tools: [
              new joint.linkTools.Button({
                markup: generateButtonMarkup('join-button', '#006400', 'U'),
                distance: '50%',
                action: () =>
                  this.schemaService.union([
                    linkDef.source.table as Table,
                    linkDef.target.table as Table,
                  ]),
              }),
            ],
          });
          return linkDef;
        })
    );
  }

  /** Enters the merging phase from the schema alignment phase. Creates a command for this
   * operation so it is undoable by the user */
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

  /** Returns all tables the current one can be unioned with (ie all tables originally from the other schema) */
  public availableTablesFor(table?: BasicTable): Array<Table> {
    if (!table || !(table instanceof Table)) return [];
    return (
      this.intService.schemas?.find((s) => !s.tables.has(table))
        ?.regularTables ?? []
    );
  }

  /**
   * Exist the merging phase and returns to the aligning phase.
   * Creates a command for this operation so it is undoable by the user
   * If the user enters the merging mode by means other than undo, a new
   * combinedSchema will be created with no merging work done.
   */
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

  /** Exits the schema integration mode and enters the regular BCNFStar schema editing with the final schema
   *  Creates a command for this operation so it is undoable by the user
   */
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
