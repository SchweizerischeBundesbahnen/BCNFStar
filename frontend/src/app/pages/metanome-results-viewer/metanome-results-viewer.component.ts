import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { DatabaseService } from '../../database.service';
import { IIndexFileEntry } from '../../../../../server/definitions/IIndexTableEntry';
import { firstValueFrom } from 'rxjs';

import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';

@Component({
  selector: 'app-metanome-results-viewer',
  templateUrl: './metanome-results-viewer.component.html',
  styleUrls: ['./metanome-results-viewer.component.css'],
})
export class MetanomeResultsViewerComponent {
  private url: string;
  public tableData: IIndexFileEntry[] = [];
  constructor(
    dataService: DatabaseService,
    private http: HttpClient,
    private notification: SbbNotificationToast
  ) {
    this.url = dataService.baseUrl + '/metanomeResults';
    this.reload();
  }

  public async reload() {
    this.tableData = await firstValueFrom(
      this.http.get<IIndexFileEntry[]>(this.url)
    );
  }

  async deleteEntry(entry: IIndexFileEntry) {
    try {
      console.log(`${this.url}/${entry.fileName}`);
      await firstValueFrom(this.http.delete(`${this.url}/${entry.fileName}`));
      this.notification.open('Deleted entry');
      await this.reload();
    } catch (e) {
      console.error(e);
      this.notification.open(
        'An error ocurred while trying to delete this metanome result',
        {
          type: 'warn',
        }
      );
    }
  }
}
