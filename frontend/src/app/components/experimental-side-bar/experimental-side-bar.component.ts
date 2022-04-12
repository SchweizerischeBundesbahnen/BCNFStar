import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-experimental-side-bar',
  templateUrl: './experimental-side-bar.component.html',
  styleUrls: ['./experimental-side-bar.component.css'],
})
export class ExperimentalSideBarComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('init');
  }
}
