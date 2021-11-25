import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  name = '';

  ngOnInit(): void {
    this.name = this.route.snapshot.paramMap.get('table_name') || '';
  }
}
