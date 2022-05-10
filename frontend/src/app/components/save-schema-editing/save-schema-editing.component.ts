import CommandProcessor from '@/src/model/commands/CommandProcessor';
import Schema from '@/src/model/schema/Schema';
import { Component, Input } from '@angular/core';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';
import * as saveAs from 'file-saver';

@Component({
  selector: 'app-save-schema-editing',
  templateUrl: './save-schema-editing.component.html',
  styleUrls: ['./save-schema-editing.component.css'],
})
export class SaveSchemaEditingComponent {
  @Input() public schema!: Schema;
  @Input() public commandProcessor!: CommandProcessor;

  constructor(private notification: SbbNotificationToast) {}

  public filename: string = '';

  public saveEditedSchema() {
    try {
      let schemaEntryToJSON = JSON.stringify(this.schema);
      // let commandProcessorJSONFile = '';
      this.downloadFile(schemaEntryToJSON);
      this.notification.open('Schema download');
    } catch (e) {
      console.error(e);
    }
  }

  private downloadFile(schmeaJSON: string) {
    const file: File = new File([schmeaJSON], this.filename + '.txt', {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(file);
  }

  private buildSchemaEntry(schema: Schema) {
    return {
      schema: schema,
    };
  }
}
