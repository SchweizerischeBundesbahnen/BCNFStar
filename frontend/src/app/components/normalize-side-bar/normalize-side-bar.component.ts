import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-normalize-side-bar',
  templateUrl: './normalize-side-bar.component.html',
  styleUrls: ['./normalize-side-bar.component.css'],
})
export class NormalizeSideBarComponent {
  constructor() {}

  // ngOnInit(): void {}

  @Input() functionalDependencies!: string[];
}
