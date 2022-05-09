import CommandProcessor from '@/src/model/commands/CommandProcessor';
import Schema from '@/src/model/schema/Schema';
import { Component, Input } from '@angular/core';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';

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
    console.log(this.schema);
    this.schema.tables.forEach((table) =>
      console.log(table.columns.sourceColumnNames())
    );
    let schemaEntryToJSON = '';
    // let commandProcessorJSONFile = '';
    try {
      schemaEntryToJSON = JSON.stringify(this.schema);
      localStorage.setItem(this.filename, schemaEntryToJSON);
      this.notification.open('Schema saved');
    } catch (e) {
      console.error(e);
    }
  }

  private buildSchemaEntry(schema: Schema) {
    return {
      schema: schema,
    };
  }
}
