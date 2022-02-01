import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-normalize-undo-redo',
  templateUrl: './normalize-undo-redo.component.html',
  styleUrls: ['./normalize-undo-redo.component.css'],
})
export class NormalizeUndoRedoComponent {
  @Input() canUndo!: boolean;
  @Input() canRedo!: boolean;
  @Output() undo = new EventEmitter();
  @Output() redo = new EventEmitter();

  constructor() {}
}
