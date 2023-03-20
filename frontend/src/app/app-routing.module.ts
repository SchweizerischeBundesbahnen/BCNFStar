import { NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterModule, Routes } from '@angular/router';
import { SchemaEditingComponent } from './pages/schema-editing/schema-editing.component';
import { MetanomeResultsViewerComponent } from './pages/metanome-results-viewer/metanome-results-viewer.component';
import { HomeComponent } from './pages/home/home.component';
import { IntegrationStartComponent } from './components/integration/integration-start/integration-start.component';
import { SchemaService } from './schema.service';
import { IntegrationService } from './integration.service';
import { SchemaMergingService } from './schema-merging.service';

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
export class AppRoutingModule {
  constructor(
    private schemaService: SchemaService,
    private intService: IntegrationService,
    private mergeService: SchemaMergingService,
    private router: Router
  ) {
    // reset edited schema and integration when going to home or integration page
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        if (evt.url === '/' || evt.url === '/integration') {
          if (this.mergeService.isMerging)
            this.mergeService.cancel();
          if (this.intService.isIntegrating)
            this.intService.stopIntegration();
          this.schemaService.hasSchema = false;
        }
      }
    });
  }
}
