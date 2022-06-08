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
  public editMode = true;

  ngOnChanges(): void {
    this.reset();
  }

  public reset() {
    this.surrogateKey = this.table.surrogateKey ?? '';
    this.editMode = !this.surrogateKey;
  }

  public emitSurrogateKey() {
    this.setSurrogateKey.emit(this.surrogateKey);
    this.editMode = false;
  }
  public deleteSurrogateKey() {
    this.surrogateKey = '';
    this.setSurrogateKey.emit(this.surrogateKey);
    this.editMode = true;
  }
}
