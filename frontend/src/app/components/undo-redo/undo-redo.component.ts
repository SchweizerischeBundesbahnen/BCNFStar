import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-undo-redo',
  templateUrl: './undo-redo.component.html',
  styleUrls: ['./undo-redo.component.css'],
})
export class UndoRedoComponent {
  @Input() public canUndo!: boolean;
  @Input() public canRedo!: boolean;
  @Output() public undo = new EventEmitter();
  @Output() public redo = new EventEmitter();

  constructor() {}
}
