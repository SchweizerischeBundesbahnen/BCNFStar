import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DatabaseSelectionComponent } from './pages/database-selection/database-selection.component';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { NormalizeComponent } from './pages/normalize/normalize.component';
import { NormalizeSideBarComponent } from './components/normalize-side-bar/normalize-side-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    DatabaseSelectionComponent,
    TableSelectionComponent,
    NormalizeComponent,
    NormalizeSideBarComponent
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
