import { SchemaService } from '@/src/app/schema.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-keys',
  templateUrl: './keys.component.html',
  styleUrls: ['./keys.component.css'],
})
export class KeysComponent {
  public surrogateKey = '';
  public editMode = true;

  constructor(public schemaService: SchemaService) {
    this.schemaService.selectedTableChanged.subscribe(() => this.reset());
  }

  public reset() {
    this.surrogateKey = this.schemaService.selectedTable?.surrogateKey ?? '';
    this.editMode = !this.surrogateKey;
  }

  public emitSurrogateKey() {
    this.schemaService.setSurrogateKey(this.surrogateKey);
    this.editMode = false;
  }
  public deleteSurrogateKey() {
    this.surrogateKey = '';
    this.schemaService.setSurrogateKey(this.surrogateKey);
    this.editMode = true;
  }
}
