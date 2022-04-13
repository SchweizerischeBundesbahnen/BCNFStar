import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { SchemaEditingComponent } from './pages/schema-editing/schema-editing.component';
import { MetanomeResultsViewerComponent } from './pages/metanome-results-viewer/metanome-results-viewer.component';

const routes: Routes = [
  { path: '', component: TableSelectionComponent },
  { path: 'edit-schema', component: SchemaEditingComponent },
  { path: 'metanome-results', component: MetanomeResultsViewerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
