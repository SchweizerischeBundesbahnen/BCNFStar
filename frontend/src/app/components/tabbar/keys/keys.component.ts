import Table from '@/src/model/schema/Table';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';

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

  constructor(private notification: SbbNotificationToast) {
    console.log(this.editMode);
  }

  ngOnChanges(): void {
    this.surrogateKey = this.table.surrogateKey ?? '';
    this.editMode = !this.surrogateKey;
    console.log(this.editMode);
  }

  emitSurrogateKey() {
    if (this.surrogateKey) {
      this.setSurrogateKey.emit(this.surrogateKey);
      this.editMode = false;
    } else
      this.notification.open('Cannot set an empty surrogate key name', {
        type: 'warn',
      });
  }
  deleteSurrogateKey() {
    this.surrogateKey = '';
    this.setSurrogateKey.emit(this.surrogateKey);
    this.editMode = true;
  }
}
