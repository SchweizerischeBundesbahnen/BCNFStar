import { Component } from '@angular/core';
import { DatabaseService } from './database.service';
import { isDevMode } from '@angular/core';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'bcnfstar';
  public queueUrl: string;
  public devMode = isDevMode();
  http: any;

  constructor(dataService: DatabaseService, notificationToast: SbbNotificationToast) {
    this.queueUrl = dataService.baseUrl + '/queue';
    dataService.getDmbsName().then((dbmsName) => {
      if (dbmsName == 'hive2')
        notificationToast.open('Spark hive2 support is experimental. Note that it does not support keys', {type: 'warn'});
    })
  }
}
