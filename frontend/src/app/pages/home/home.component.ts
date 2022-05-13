import Schema from '@/src/model/schema/Schema';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../../database.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private dataService: DatabaseService, private router: Router) {}

  public setSchemaAndGo(schema: Schema) {
    console.log('got schema');
    console.log(schema);
    this.dataService.schema = schema;
    this.router.navigate(['/edit-schema']);
  }
}
