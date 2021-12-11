import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { DatabaseSelectionComponent } from './pages/database-selection/database-selection.component';
import { NormalizeComponent } from './pages/normalize/normalize.component';
// import { TestJoinJsComponent } from './test-join-js/test-join-js.component';
// import { GraphElementComponent } from './graph-element/graph-element.component';

const routes: Routes = [
  { path: '', redirectTo: '/database-selection', pathMatch: 'full' },
  { path: 'database-selection', component: DatabaseSelectionComponent },
  { path: 'table-selection', component: TableSelectionComponent },
  { path: 'normalize/:table_name', component: NormalizeComponent },
  { path: 'normalize', component: NormalizeComponent },
  // { path: 'testing', component: TestJoinJsComponent },
  // { path: 'graph', component: GraphElementComponent },
  { path: '**', redirectTo: '/database-selection' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
