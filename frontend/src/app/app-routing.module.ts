import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TableSelectionComponent } from './pages/table-selection/table-selection.component';
import { DatabaseSelectionComponent } from './pages/database-selection/database-selection.component';
import { NormalizeComponent } from './pages/normalize/normalize.component';

const routes: Routes = [
  { path: '', component: DatabaseSelectionComponent },
  { path: 'table-selection', component: TableSelectionComponent },
  { path: 'normalize/:table_name', component: NormalizeComponent },
  { path: '**', redirectTo: '/database-selection' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
