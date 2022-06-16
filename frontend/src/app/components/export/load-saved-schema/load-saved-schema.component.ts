import { Component } from '@angular/core';
import Schema from '@/src/model/schema/Schema';
import { Router } from '@angular/router';
import { parse } from 'zipson';
import * as JSZip from 'jszip';
import SaveSchemaState from '@/src/model/schema/methodObjects/saveIntermediateState';
import { SchemaService } from '@/src/app/schema.service';

@Component({
  selector: 'app-load-saved-schema',
  templateUrl: './load-saved-schema.component.html',
  styleUrls: ['./load-saved-schema.component.css'],
})
export class LoadSavedSchemaComponent {
  public newSchema = new Schema();
  public file: File = new File([], '');

  constructor(public schemaService: SchemaService, public router: Router) {}

  public onChange(fileList: Array<File>) {
    if (fileList) {
      this.file = fileList[0];
    }
  }

  public async onLoad() {
    let newZip = new JSZip();
    const zipResult = await newZip.loadAsync(this.file);
    for (let file in zipResult.files) {
      await zipResult
        .file(file)
        ?.async('string')
        .then((result) => {
          this.getSchema(result);
          this.schemaService.setSchema(this.newSchema);
          this.router.navigate(['/edit-schema']);
        });
    }
  }

  public getSchema(savedZipedSchemaEntry: string) {
    let schemaObject = parse(savedZipedSchemaEntry);
    this.newSchema = new SaveSchemaState().parseSchema(schemaObject);
  }
}
