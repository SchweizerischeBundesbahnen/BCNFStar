export default interface BasicColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  dataTypeString: string;
}

export function surrogateKeyColumn(name: string): BasicColumn {
  return {
    name: name,
    dataType: 'integer',
    nullable: false,
    dataTypeString: '(integer, not null)',
  };
}
