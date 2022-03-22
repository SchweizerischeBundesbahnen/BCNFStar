import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { NormalizeComponent } from './pages/normalize/normalize.component';
import { NormalizeSideBarComponent } from './components/normalize-side-bar/normalize-side-bar.component';
import { SbbIconModule } from '@sbb-esta/angular/icon';
import { NormalizeSchemaGraphComponent } from './components/normalize-schema-graph/normalize-schema-graph.component';
import { SbbAccordionModule } from '@sbb-esta/angular/accordion';
import { SbbButtonModule } from '@sbb-esta/angular/button';
import { SbbCheckboxModule } from '@sbb-esta/angular/checkbox';
import { SbbDialogModule } from '@sbb-esta/angular/dialog';
import { SbbLoadingModule } from '@sbb-esta/angular/loading';
import { SbbRadioButtonModule } from '@sbb-esta/angular/radio-button';
import { SbbTableModule } from '@sbb-esta/angular/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GraphElementComponent } from './graph-element/graph-element.component';
import { NormalizeUndoRedoComponent } from './components/normalize-undo-redo/normalize-undo-redo.component';
import { SplitDialogComponent } from './components/split-dialog/split-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    TableSelectionComponent,
    NormalizeComponent,
    NormalizeSideBarComponent,
    NormalizeSchemaGraphComponent,
    GraphElementComponent,
    NormalizeUndoRedoComponent,
    SplitDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SbbRadioButtonModule,
    SbbButtonModule,
    SbbAccordionModule,
    SbbLoadingModule,
    SbbIconModule,
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
