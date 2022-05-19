import { NgModule, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TableSelectionComponent } from './components/table-selection/table-selection.component';
import { SchemaEditingComponent } from './pages/schema-editing/schema-editing.component';
import { SchemaEditingSideBarComponent } from './components/schema-editing-side-bar/schema-editing-side-bar.component';
import { SbbIconModule } from '@sbb-esta/angular/icon';
import { SchemaGraphComponent } from './components/schema-graph/schema-graph.component';
import { SbbAccordionModule } from '@sbb-esta/angular/accordion';
import { SbbButtonModule } from '@sbb-esta/angular/button';
import { SbbCheckboxModule } from '@sbb-esta/angular/checkbox';
import { SbbDialogModule } from '@sbb-esta/angular/dialog';
import { SbbPaginationModule } from '@sbb-esta/angular/pagination';
import { SbbTooltipModule } from '@sbb-esta/angular/tooltip';
import { SbbHeaderLeanModule } from '@sbb-esta/angular/header-lean';
import { SbbNotificationToastModule } from '@sbb-esta/angular/notification-toast';
import { SbbLoadingModule } from '@sbb-esta/angular/loading';
import { SbbRadioButtonModule } from '@sbb-esta/angular/radio-button';
import { SbbTableModule } from '@sbb-esta/angular/table';
import { SbbTabsModule } from '@sbb-esta/angular/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GraphElementComponent } from './components/graph-element/graph-element.component';
import { UndoRedoComponent } from './components/undo-redo/undo-redo.component';
import { SplitDialogComponent } from './components/split-dialog/split-dialog.component';
import { SbbSelectModule } from '@sbb-esta/angular/select';
import { MetanomeResultsViewerComponent } from './pages/metanome-results-viewer/metanome-results-viewer.component';
import { MetanomeSettingsComponent } from './components/metanome-settings/metanome-settings.component';
import { SbbFormFieldModule } from '@sbb-esta/angular/form-field';
import { SbbToggleModule } from '@sbb-esta/angular/toggle';
import { CustomFunctionalDependencySideBarComponent } from '@/src/app/components/check-fd/check-fd.component';
import { ViolatingRowsViewComponent } from '@/src/app/components/violating-rows-view/violating-rows-view.component';
import { JoinDialogComponent } from './components/join-dialog/join-dialog.component';
import { CheckIndComponent } from '@/src/app/components/check-ind/check-ind.component';
import { ViolatingRowsViewIndsComponent } from './components/violating-rows-view-inds/violating-rows-view-inds.component';
import { DatabaseTableViewerComponent } from './components/database-table-viewer/database-table-viewer.component';
import { TableEditingComponent } from './components/table-editing/table-editing.component';
import { HomeComponent } from './pages/home/home.component';

import { SaveSchemaEditingComponent } from './components/save-schema-editing/save-schema-editing.component';
import { LoadSavedSchemaComponent } from './components/load-saved-schema/load-saved-schema.component';
import { SbbFileSelectorModule } from '@sbb-esta/angular/file-selector';
export let InjectorInstance: Injector;

@NgModule({
  declarations: [
    AppComponent,
    TableSelectionComponent,
    SchemaEditingComponent,
    SchemaEditingSideBarComponent,
    SchemaGraphComponent,
    GraphElementComponent,
    UndoRedoComponent,
    SplitDialogComponent,
    JoinDialogComponent,
    MetanomeResultsViewerComponent,
    MetanomeSettingsComponent,
    CustomFunctionalDependencySideBarComponent,
    ViolatingRowsViewComponent,
    CheckIndComponent,
    ViolatingRowsViewIndsComponent,
    DatabaseTableViewerComponent,
    SaveSchemaEditingComponent,
    LoadSavedSchemaComponent,
    TableEditingComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SbbRadioButtonModule,
    SbbButtonModule,
    SbbAccordionModule,
    SbbLoadingModule,
    SbbSelectModule,
    SbbTooltipModule,
    SbbHeaderLeanModule,
    SbbNotificationToastModule,
    SbbIconModule,
    SbbCheckboxModule,
    SbbPaginationModule,
    SbbDialogModule,
    SbbTableModule,
    SbbFormFieldModule,
    SbbToggleModule,
    SbbFileSelectorModule,
    SbbTabsModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private injector: Injector) {
    InjectorInstance = this.injector;
  }
}
