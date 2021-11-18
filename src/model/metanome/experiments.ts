import FunctionalDependency from "./FunctionalDependency";
import Table from "./table";

const table: Table = Table.fromColumnNames("Name", "Sportart", "Verein");
table.addFd(table.columns.subsetFromIds(0, 1), table.columns.subsetFromIds(2));
table.addFd(table.columns.subsetFromIds(2), table.columns.subsetFromIds(1));
console.log(`${table}`);
table.extendFds();
const fd = table.violatingFds()[0];
const [table1, table2] = table.split(fd);
console.log(table1.toString());
console.log(table2.toString());
