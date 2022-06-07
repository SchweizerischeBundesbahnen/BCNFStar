import { SchemaService } from '@/src/app/schema.service';
import { Component, OnChanges } from '@angular/core';
import { SbbNotificationToast } from '@sbb-esta/angular/notification-toast';

@Component({
  selector: 'app-keys',
  templateUrl: './keys.component.html',
  styleUrls: ['./keys.component.css'],
})
export class KeysComponent implements OnChanges {
  public surrogateKey = '';
  public editMode = true;

  constructor(
    public schemaService: SchemaService,
    private notification: SbbNotificationToast
  ) {}

  ngOnChanges(): void {
    this.surrogateKey = this.schemaService.selectedTable?.surrogateKey ?? '';
    this.editMode = !this.surrogateKey;
  }

  emitSurrogateKey() {
    if (this.surrogateKey) {
      this.schemaService.setSurrogateKey(this.surrogateKey);
      this.editMode = false;
    } else
      this.notification.open('Cannot set an empty surrogate key name', {
        type: 'warn',
      });
  }
  deleteSurrogateKey() {
    this.surrogateKey = '';
    this.schemaService.setSurrogateKey(this.surrogateKey);
    this.editMode = true;
  }
}
