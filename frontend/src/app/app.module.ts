import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GraphElementComponent } from './components/graph-element/graph-element.component';
import { UndoRedoComponent } from './components/undo-redo/undo-redo.component';
import { SplitDialogComponent } from './components/split-dialog/split-dialog.component';
import { SbbSelectModule } from '@sbb-esta/angular/select';
import { MetanomeResultsViewerComponent } from './pages/metanome-results-viewer/metanome-results-viewer.component';
import { CustomFunctionalDependencySideBarComponent } from '@/src/app/components/check-fd/check-fd.component';
import { ViolatingRowsViewComponent } from '@/src/app/components/violating-rows-view/violating-rows-view.component';
import { JoinDialogComponent } from './components/join-dialog/join-dialog.component';

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
    CustomFunctionalDependencySideBarComponent,
    ViolatingRowsViewComponent,
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
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
