import FunctionalDependency from './FunctionalDependency';
import Table from './Table';

export function exampleTable(): Table {
  const table: Table = Table.fromColumnNames('Name', 'Sportart', 'Verein');
  table.name = 'Example Table';
  table.addFd(
    table.columns.subsetFromIds(0, 1),
    table.columns.subsetFromIds(2)
  );
  table.addFd(table.columns.subsetFromIds(2), table.columns.subsetFromIds(1));
  table.extendFds();
  return table;
}
const table = exampleTable();
const fd = table.violatingFds()[0];
table.split(fd);
console.log(table.allResultingTablesToMermaidString());
