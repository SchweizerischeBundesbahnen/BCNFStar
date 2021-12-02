import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DatabaseSelectionComponent } from './pages/database-selection/database-selection.component';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { NormalizeComponent } from './pages/normalize/normalize.component';
import { NormalizeSideBarComponent } from './components/normalize-side-bar/normalize-side-bar.component';
import { NormalizeSchemaGraphComponent } from './components/normalize-schema-graph/normalize-schema-graph.component';
import { SbbRadioButtonModule } from '@sbb-esta/angular-business';
import { SbbButtonModule } from '@sbb-esta/angular-business';
import { SbbAccordionModule } from '@sbb-esta/angular-business';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    DatabaseSelectionComponent,
    TableSelectionComponent,
    NormalizeComponent,
    NormalizeSideBarComponent,
    NormalizeSchemaGraphComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SbbRadioButtonModule,
    SbbButtonModule,
    SbbAccordionModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
