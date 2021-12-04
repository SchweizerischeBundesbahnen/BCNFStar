import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from 'src/app/database.service';

@Component({
  selector: 'app-normalize',
  templateUrl: './normalize.component.html',
  styleUrls: ['./normalize.component.css'],
})
export class NormalizeComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private dataService: DatabaseService
  ) {}

  tableName = '';
  functionalDependencies: string[] = [];

  ngOnInit(): void {
    this.tableName = this.route.snapshot.paramMap.get('table_name') || '';
    this.functionalDependencies =
      this.dataService.getFunctionalDependenciesByTableName(this.tableName);
  }
}
