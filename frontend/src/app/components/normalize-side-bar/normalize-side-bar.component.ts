import { AfterViewInit, Component } from '@angular/core';
import { SchemaService } from 'src/app/schema.service';
import FunctionalDependency from 'src/model/schema/FunctionalDependency';

@Component({
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent {
  constructor(public schemaService: SchemaService) {}

  selectFd(fd: FunctionalDependency): void {
    this.schemaService.selectedTable?.split(fd);
    console.log(this.schemaService.inputTable?.allResultingTables());
  }
}
