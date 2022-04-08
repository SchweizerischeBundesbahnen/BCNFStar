import SourceTable from './SourceTable';

export default class SourceColumn {
  public constructor(
    public name: string,
    public table: SourceTable,
    public dataType: string,
    public ordinalPosition: number,
    public nullable: boolean
  ) {}
}
