import { Component } from '@angular/core';
import { DatabaseService } from './database.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'bcnfstar';
  public queueUrl: string;
  constructor(private dataService: DatabaseService) {
    this.queueUrl = dataService.baseUrl + '/queue';
  }
}
