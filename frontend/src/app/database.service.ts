import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ITable from '../../../server/definitions/ITable';
import ITableHead from '../../../server/definitions/ITableHead';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  constructor(private http: HttpClient) {}

  getTableNames() {
    const result = this.http.get<ITable[]>('http://localhost:80/tables');
    return result;
  }
  getFunctionalDependenciesByTableName(tableName: string) {
    return ['A -> B', 'B -> C', 'C -> D'];
  }
}
