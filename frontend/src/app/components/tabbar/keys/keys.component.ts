import Table from '@/src/model/schema/Table';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-keys',
  templateUrl: './keys.component.html',
  styleUrls: ['./keys.component.css'],
})
export class KeysComponent {
  @Input() public table!: Table;
  constructor() {}
}
