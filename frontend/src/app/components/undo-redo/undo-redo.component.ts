import { Component } from '@angular/core';
import { SchemaService } from '../../schema.service';

@Component({
  selector: 'app-undo-redo',
  templateUrl: './undo-redo.component.html',
  styleUrls: ['./undo-redo.component.css'],
})
export class UndoRedoComponent {
  constructor(public schemaService: SchemaService) {}
}
