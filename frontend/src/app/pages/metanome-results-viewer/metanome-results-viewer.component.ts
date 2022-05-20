import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { DatabaseService } from '../../database.service';
import { IIndexFileEntry } from '@server/definitions/IIndexFileEntry';
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
  public isLoading: boolean = false;
  constructor(
    dataService: DatabaseService,
    private http: HttpClient,
    private notification: SbbNotificationToast
  ) {
    this.url = dataService.baseUrl + '/metanomeResults';
    this.reload();
  }

  public async reload() {
    this.isLoading = true;
    try {
      this.tableData = (
        await firstValueFrom(this.http.get<IIndexFileEntry[]>(this.url))
      ).sort(function (a: IIndexFileEntry, b: IIndexFileEntry) {
        return a.createDate >= b.createDate ? -1 : 1;
      });
    } finally {
      this.isLoading = false;
    }
  }

  async deleteAllEntries() {
    await Promise.all(
      this.tableData.map((entry) => this.deleteEntry(entry, true))
    );
    this.notification.open('Deleted all entries');
    await this.reload();
  }

  async deleteEntry(entry: IIndexFileEntry, multiple = false) {
    try {
      await firstValueFrom(this.http.delete(`${this.url}/${entry.fileName}`));
      if (!multiple) {
        this.notification.open('Deleted entry');
        await this.reload();
      }
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
