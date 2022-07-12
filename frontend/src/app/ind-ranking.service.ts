import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { InjectorInstance } from './app.module';
import IndScore from '../model/schema/methodObjects/IndScore';
import SourceRelationship from '../model/schema/SourceRelationship';

@Injectable({
  providedIn: 'root',
})
export class IndRankingService {
  protected dbService: DatabaseService;
  constructor() {
    this.dbService = InjectorInstance.get<DatabaseService>(DatabaseService);
  }

  public rankTableRelationships(inds: SourceRelationship[]): void {
    let scores: Array<Promise<number>> = [];
    inds.forEach((ind) => scores.push(new IndScore(ind, this.dbService).get()));
    Promise.all(scores).then((values) =>
      values.forEach((score, i) => {
        inds[i].relationship._score = score;
      })
    );
    inds.sort((a, b) => a.relationship._score! - b.relationship._score!);
  }
}
