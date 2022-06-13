import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-sbb-option-all',
  templateUrl: './sbb-option-all.component.html',
  styleUrls: ['./sbb-option-all.component.css'],
})
export class SbbOptionAllComponent<T> {
  @Input() available: Array<T> = [];
  @Input() current: Array<T> = [];
  @Output() currentChange = new EventEmitter<Array<T>>();

  public clickSelectAll() {
    if (this.areAllSelected()) this.currentChange.emit([]);
    else this.currentChange.emit([...this.available]);
  }

  public areAllSelected() {
    return this.available.every((el) => this.current.includes(el));
  }

  public areZeroSelected() {
    return this.available.every((el) => !this.current.includes(el));
  }
}
