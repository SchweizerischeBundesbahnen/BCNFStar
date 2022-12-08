import Schema from '../Schema';
import SQLPersisting from './SQLPersisting';
import TableRelationship from '../TableRelationship';
import BasicTable from '../BasicTable';
import Table from '../Table';
import BasicColumn from '../../types/BasicColumn';
import UnionedTable from '../UnionedTable';

export default class SparkSqlPersisting extends SQLPersisting {

  
  public override createSQL(schema: Schema): string {
    let SQL = '';
    SQL += this.schemaPreparation(schema);
    SQL += this.tableCreation(schema);
    SQL += this.dataTransfer([...schema.tables]);
    return SQL;//.replaceAll('"', '');
  }

  public schemaPreparation(schema: Schema): string {
    let Sql: string = '';
    Sql += `CREATE SCHEMA IF NOT EXISTS ${this.schemaName!};` + '\n';
    for (const table of schema.tables) {
      Sql +=
        `DROP TABLE IF EXISTS ${this.tableIdentifier(table)};` + '\n';
    }
    return Sql;
  }

  private dataTypeToSqlName(dataType: string): string {
    switch (dataType) {

      case "BooleanType":
         return "BOOLEAN";
      case "ByteType":
         return "BYTE";
      case "ShortType":
         return "SHORT";
      case "IntegerType":
         return "INT";
      case "LongType":
         return "LONG";
      case "FloatType":
         return "FLOAT";
      case "DoubleType":
         return "DOUBLE";
      case "DateType":
        return "DATE";
      case "TimestampType":
        return "TIMESTAMP";
      case "StringType":
        return "STRING";
      case "BinaryType":
        return "BINARY";
      case "DecimalType":
        return "DECIMAL";
      default:
        throw new Error(`Datatype ${dataType} is not a valid Spark DataType!`);

   }

  }

  public override tableCreation(
    schema: Schema,
    tables: Iterable<BasicTable> = schema.tables,
    keepSchema = false
  ): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.createTableSql(schema, table, keepSchema) + '\n';
    }
    return Sql;
  }

  /**
   * @returns a CREATE TABLE statement containing all final columns, but no keys for the given `table`
   */
  public override createTableSql(
    schema: Schema,
    table: BasicTable,
    keepSchema = false
  ): string {
    let columnStrings: string[] = [];

    let columns: Array<BasicColumn> = [];

    if (table instanceof Table) {
      if (table.implementsSurrogateKey()) {
        columnStrings.push(this.surrogateKeyString(table.surrogateKey));
      }
      columns = Array.from(table.columns);
    } else if (table instanceof UnionedTable) {
      columns = table.displayedColumns();
    }

    for (const column of columns) {
      let columnString: string = `${column.name} ${this.dataTypeToSqlName(column.dataType)} `;
      columnStrings.push(columnString);
    }
    const tableName = keepSchema
      ? this.escape(table.fullName)
      : this.tableIdentifier(table);
    return `CREATE TABLE ${tableName} (${columnStrings.join(',\n')});\n`;
  }


  public override updateSurrogateKeySource(fk: TableRelationship): string {
    return this.tableIdentifier(fk.referencedTable);
  }

  /** The column is only necessary for the data transfer. We don't want to insert data later.
   * Thus, GENERATED ALWAYS options is sufficient */
  public override surrogateKeyString(name: string): string {
    return `${name} INT GENERATED ALWAYS AS IDENTITY`;
  }

  public escape(str: string) {
    return `${str}`;
  }
}
