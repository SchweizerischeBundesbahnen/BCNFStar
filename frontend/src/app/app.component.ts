import { Component, isDevMode } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'bcnfstar';
  public isDevMode = isDevMode();
  public queueUrl: string = isDevMode()
    ? 'http://localhost:80/queue'
    : '/queue';
}
