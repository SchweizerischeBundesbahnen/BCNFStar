import { Component, EventEmitter, Input, Output } from '@angular/core';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';
import Table from 'src/model/schema/Table';

@Component({
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent {
  @Input() table!: Table;
  @Output() splitFd = new EventEmitter<FunctionalDependency>();

  constructor() {}

  selectFd(fd: FunctionalDependency): void {
    this.splitFd.emit(fd);
  }
}
