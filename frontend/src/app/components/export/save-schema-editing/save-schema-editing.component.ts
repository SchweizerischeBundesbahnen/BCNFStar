import { SchemaService } from '@/src/app/schema.service';
import { Component } from '@angular/core';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';
import * as saveAs from 'file-saver';
import * as JSZip from 'jszip';
import { stringify } from 'zipson';

@Component({
  selector: 'app-save-schema-editing',
  templateUrl: './save-schema-editing.component.html',
  styleUrls: ['./save-schema-editing.component.css'],
})
export class SaveSchemaEditingComponent {
  constructor(
    private notification: SbbNotificationToast,
    private schemaService: SchemaService
  ) {}

  public filename: string = '';

  public saveEditedSchema() {
    try {
      let schemaEntryToJSON = JSON.stringify(this.schemaService.schema);
      let zipedJSON = stringify(JSON.parse(schemaEntryToJSON));
      this.downloadFile(zipedJSON);
      this.notification.open('Schema download');
    } catch (e) {
      console.error(e);
    }
  }

  private downloadFile(schmeaJSON: string) {
    let zip = new JSZip();
    zip.file(this.filename + '.bcnfstar', schmeaJSON);
    zip
      .generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      })
      .then((content) => {
        // see FileSaver.js
        saveAs(content, this.filename + '.zip');
      });
  }
}
