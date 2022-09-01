import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SchemaEditingComponent } from './pages/schema-editing/schema-editing.component';
import { MetanomeResultsViewerComponent } from './pages/metanome-results-viewer/metanome-results-viewer.component';
import { HomeComponent } from './pages/home/home.component';
import { IntegrationStartComponent } from './components/integration/integration-start/integration-start.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'edit-schema', component: SchemaEditingComponent },
  { path: 'metanome-results', component: MetanomeResultsViewerComponent },
  { path: 'integration', component: IntegrationStartComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
