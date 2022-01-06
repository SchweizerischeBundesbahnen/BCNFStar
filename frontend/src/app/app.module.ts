import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DatabaseSelectionComponent } from './pages/database-selection/database-selection.component';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { NormalizeComponent } from './pages/normalize/normalize.component';
import { NormalizeSideBarComponent } from './components/normalize-side-bar/normalize-side-bar.component';
import {
  SbbRadioButtonModule,
  SbbAccordionModule,
  SbbButtonModule,
} from '@sbb-esta/angular-business';
import { SbbIconModule } from '@sbb-esta/angular-core';
import { NormalizeSchemaGraphComponent } from './components/normalize-schema-graph/normalize-schema-graph.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GraphElementComponent } from './graph-element/graph-element.component';
import { NormalizeUndoRedoComponent } from './components/normalize-undo-redo/normalize-undo-redo.component';

@NgModule({
  declarations: [
    AppComponent,
    DatabaseSelectionComponent,
    TableSelectionComponent,
    NormalizeComponent,
    NormalizeSideBarComponent,
    NormalizeSchemaGraphComponent,
    GraphElementComponent,
    NormalizeUndoRedoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SbbRadioButtonModule,
    SbbButtonModule,
    SbbAccordionModule,
    SbbIconModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
