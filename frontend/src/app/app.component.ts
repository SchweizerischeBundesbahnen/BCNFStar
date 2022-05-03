import { Component } from '@angular/core';
import { DatabaseService } from './database.service';
import { isDevMode } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'bcnfstar';
  public queueUrl: string;
  public devMode = isDevMode();

  constructor(dataService: DatabaseService) {
    this.queueUrl = dataService.baseUrl + '/queue';
  }
}
