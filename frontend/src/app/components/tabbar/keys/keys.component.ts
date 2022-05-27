import Table from '@/src/model/schema/Table';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-keys',
  templateUrl: './keys.component.html',
  styleUrls: ['./keys.component.css'],
})
export class KeysComponent implements OnChanges {
  @Input() public table!: Table;
  @Output() public setSurrogateKey = new EventEmitter<string>();

  public surrogateKey = '';

  constructor() {}

  ngOnChanges(): void {
    this.surrogateKey = this.table?.surrogateKey ?? '';
  }
}
