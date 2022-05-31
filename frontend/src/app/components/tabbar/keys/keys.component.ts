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
  public editMode = false;
  public surrogateKeyExists = false;

  constructor() {}

  ngOnChanges(): void {
    this.surrogateKey = this.table.surrogateKey ?? '';
    this.surrogateKeyExists = !!this.table.surrogateKey;
  }

  emitSurrogateKey() {
    this.setSurrogateKey.emit(this.surrogateKey);
    this.editMode = false;
    this.surrogateKeyExists = true;
  }
  deleteSurrogateKey() {
    this.setSurrogateKey.emit('');
    this.surrogateKeyExists = false;
    this.surrogateKey = '';
  }
}
