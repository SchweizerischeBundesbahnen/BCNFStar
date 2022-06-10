import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SchemaEditingComponent } from './pages/schema-editing/schema-editing.component';
import { MetanomeResultsViewerComponent } from './pages/metanome-results-viewer/metanome-results-viewer.component';
import { HomeComponent } from './pages/home/home.component';
import { MatchingViewerComponent } from './components/matching-viewer/matching-viewer.component';
import { IntegrationStartComponent } from './integration/integration-start/integration-start.component';
import { MatchingEditorComponent } from './integration/matching-editor/matching-editor.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'edit-schema', component: SchemaEditingComponent },
  { path: 'metanome-results', component: MetanomeResultsViewerComponent },
  { path: 'matching-viewer', component: MatchingViewerComponent },
  { path: 'integration', component: IntegrationStartComponent },
  { path: 'matching', component: MatchingEditorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
