import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Relationship from '../model/schema/Relationship';
import Table from '../model/schema/Table';

@Injectable({
  providedIn: 'root',
})
export class IndService {
  public inds: BehaviorSubject<
    Array<{ relationship: Relationship; table: Table }>
  > = new BehaviorSubject(
    new Array<{ relationship: Relationship; table: Table }>()
  );
  public currentInds = this.inds.asObservable();

  public changeInd(
    nextInd: Array<{ relationship: Relationship; table: Table }>
  ) {
    this.inds.next(nextInd);
  }
}
