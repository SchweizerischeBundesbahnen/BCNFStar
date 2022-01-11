import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DatabaseSelectionComponent } from './pages/database-selection/database-selection.component';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { NormalizeComponent } from './pages/normalize/normalize.component';
import { NormalizeSideBarComponent } from './components/normalize-side-bar/normalize-side-bar.component';
import { NormalizeSchemaGraphComponent } from './components/normalize-schema-graph/normalize-schema-graph.component';
import { SbbAccordionModule } from '@sbb-esta/angular/accordion';
import { SbbButtonModule } from '@sbb-esta/angular/button';
import { SbbCheckboxModule } from '@sbb-esta/angular/checkbox';
import { SbbDialogModule } from '@sbb-esta/angular/dialog';
import { SbbRadioButtonModule } from '@sbb-esta/angular/radio-button';
import { SbbTableModule } from '@sbb-esta/angular/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NormalizeUndoRedoComponent } from './components/normalize-undo-redo/normalize-undo-redo.component';
import { SplitDialogComponent } from './components/split-dialog/split-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    DatabaseSelectionComponent,
    TableSelectionComponent,
    NormalizeComponent,
    NormalizeSideBarComponent,
    NormalizeSchemaGraphComponent,
    NormalizeUndoRedoComponent,
    SplitDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SbbRadioButtonModule,
    SbbButtonModule,
    SbbAccordionModule,
    SbbCheckboxModule,
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
