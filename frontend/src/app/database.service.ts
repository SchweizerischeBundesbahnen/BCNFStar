import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '../../../server/definitions/ITable';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {}

  getTableNames() {
    const result = this.http.get<ITable[]>('http://localhost:80/tables');
    return result;
  }
  getFunctionalDependenciesByTableName() {
    return ['A -> B', 'B -> C', 'C -> D'];
  }
}
