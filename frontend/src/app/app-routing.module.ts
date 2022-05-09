import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { SchemaEditingComponent } from './pages/schema-editing/schema-editing.component';
import { MetanomeResultsViewerComponent } from './pages/metanome-results-viewer/metanome-results-viewer.component';
import { LoadSavedSchemaComponent } from './pages/load-saved-schema/load-saved-schema.component';

const routes: Routes = [
  { path: '', component: TableSelectionComponent },
  { path: 'edit-schema', component: SchemaEditingComponent },
  { path: 'metanome-results', component: MetanomeResultsViewerComponent },
  { path: 'load-saved-schema', component: LoadSavedSchemaComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
