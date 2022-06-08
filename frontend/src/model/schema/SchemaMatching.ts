import Column from './Column';
import Table from './Table';

const exampleGraphA = { a: { a1: 'l1', a2: 'l1' }, a1: { a2: 'l2' } };
const exampleGraphB = { b: { b1: 'l1', b2: 'l2' }, b2: { b1: 'l2' } };

type Graph<LabelType> = Record<string, Record<string, LabelType>>;

function init<T>(
  obj: Record<string, Record<string, T>>,
  key: string
): Record<string, T> {
  if (!obj[key]) obj[key] = {};
  return obj[key];
}

function increment(obj: Record<string, number>, key: string, by = 1) {
  obj[key] = obj[key] + by || by;
}

function columnIdentifier(table: Table, col: Column) {
  return `${table.fullName}.${col.name}`;
}

/**
 *
 * @param graph Record<label, start,end>
 */
function buildPCG(graphLeft: Graph<string>, graphRight: Graph<string>) {
  const pcg: Graph<string> = {};
  iterateGraph(graphLeft, (startLeft, endLeft, labelLeft) => {
    iterateGraph(graphRight, (startRight, endRight, labelRight) => {
      if (labelRight !== labelLeft) return;
      const start = `${startLeft}:${startRight}`;
      const end = `${endLeft}:${endRight}`;
      const startObj = init(pcg, start);
      startObj[end] = labelLeft;
    });
  });
  return pcg;
}
/**
 *
 * @param pcg
 * @returns Record<start,Record<end, propagation value>
 */
function buildIPG(pcg: Graph<string>) {
  const ipg: Graph<number> = {};
  const startCounts: Record<string, Record<string, number>> = {};
  const endCounts: Record<string, Record<string, number>> = {};
  iterateGraph(pcg, (start, end, label) => {
    init(startCounts, label);
    increment(startCounts[label], start);
    init(endCounts, label);
    increment(endCounts[label], end);
  });
  iterateGraph(pcg, (start, end, label) => {
    init(ipg, start);
    init(ipg, end);
    increment(ipg[start], end, 1.0 / startCounts[label][start]);
    increment(ipg[end], start, 1.0 / endCounts[label][end]);
  });
  return ipg;
}

function propagate(
  ipg: Graph<number>,
  initial: Record<string, number>,
  last: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  let normalizationFactor = 0;
  const contribution = (node: string) =>
    (last[node] || 0) + (initial[node] || 0);
  // for testing
  // (last[node] || 1) + (initial[node] || 1);
  // last[node] + initial[node]
  // last[node] || 1
  for (const start in ipg) {
    result[start] = contribution(start);
    for (const end in ipg[start]) {
      const propagationVal = ipg[end][start];
      result[start] += propagationVal * contribution(end);
      normalizationFactor = Math.max(normalizationFactor, result[start]);
    }
  }
  for (const key in result) result[key] /= normalizationFactor;
  return result;
}
function filter(flooded: Record<string, number>, selectThreshold = 0.975) {
  const semanticallyFiltered: Record<string, number> = {};
  for (const [name, sim] of Object.entries(flooded)) {
    const [left, right] = name.split(':');
    if (name.startsWith('_'))
      semanticallyFiltered[`${left.slice(1)}:${right.slice(1)}`] = sim;
  }
  // leftName, rightName, score
  const maxSimilarity: Record<string, number> = {};
  for (const [name, sim] of Object.entries(semanticallyFiltered)) {
    const [left, right] = name.split(':');
    maxSimilarity[left] = Math.max(maxSimilarity[left] || 0, sim);
    maxSimilarity[right] = Math.max(maxSimilarity[right] || 0, sim);
  }
  const relativeSimilarities: Record<string, Record<string, number>> = {};
  for (const [name, sim] of Object.entries(semanticallyFiltered)) {
    const [left, right] = name.split(':');
    init(relativeSimilarities, left);
    if (
      sim / maxSimilarity[left] > selectThreshold &&
      sim / maxSimilarity[right] > selectThreshold
    ) {
      relativeSimilarities[left][right] = sim / maxSimilarity[left];
    }
  }

  return relativeSimilarities;
}

function iterateGraph<T>(
  graph: Graph<T>,
  cb: (start: string, end: string, val: T) => void
) {
  for (const [start, startObj] of Object.entries(graph))
    for (const [end, val] of Object.entries(startObj)) {
      cb(start, end, val);
    }
}

export function nodeCount(graph: Graph<any>) {
  const nodes = new Set<string>();
  iterateGraph(graph, (start, end) => {
    nodes.add(start);
    nodes.add(end);
  });
  return nodes.size;
}

export default function matchSchemas(
  tablesLeft: Array<Table>,
  tablesRight: Array<Table>
) {
  const graphLeft = createGraph(tablesLeft);
  const graphRight = createGraph(tablesRight);
  debugger;
  // currently overridden by just levenstein for everything
  const initialSimliarity = calcInitialSimilarity(tablesLeft, tablesRight);
  const flooded = similarityFlood(graphLeft, graphRight, initialSimliarity);
  const filtered = filter(flooded);
  return filtered;
}

function matchSchemasTest() {
  // const initial = { 'a:b': 1, 'a:b1': 1, 'a:b2': 1, 'a1:b': 1, 'a1:b1': 1, 'a1:b2': 1, 'a2:b': 1, 'a2:b1': 1, 'a2:b2': 1 }
  const flooded = similarityFlood(exampleGraphA, exampleGraphB, {});
  const filtered = filter(flooded);
  return filtered;
}

// matchSchemasTest()
function similarityFlood(
  graphLeft: Graph<string>,
  graphRight: Graph<string>,
  initial: Record<string, number>
) {
  const pcg = buildPCG(graphLeft, graphRight);
  const newInitial = buildNewInitial(pcg);
  initial = newInitial;

  const ipg = buildIPG(pcg);
  const threshold = 1e-9;
  let last: Record<string, number>;
  let current: Record<string, number> = initial;
  let difference;
  do {
    last = current;
    current = propagate(ipg, initial, last);
    // calculating cha^nge by computing the length of the residual vector
    const residualVector = Object.keys(current).map(
      (node) => current[node] - (last[node] || 1)
    );
    difference = Math.sqrt(
      residualVector.reduce((prev, curr) => prev + curr * curr, 0)
    );
  } while (difference > threshold);
  return current;
}

function createGraph(tables: Table[]): Graph<string> {
  const initStart = (start: string) => {
    if (!graph[start]) graph[start] = {};
  };
  const graph: Graph<string> = {};

  // to denote name nodes
  const _ = '_';

  for (const table of tables) {
    initStart(table.fullName);
    graph[table.fullName]['table'] = 'type';
    graph[table.fullName][_ + table.name] = 'name';
    for (const column of table.columns) {
      const colNode = columnIdentifier(table, column);
      initStart(colNode);
      graph[table.fullName][colNode] = 'column';
      graph[colNode]['column'] = 'type';
      graph[colNode][_ + column.name] = 'name';
      graph[colNode][column.dataType] = 'SQLType';
      initStart(column.dataType);
      graph[column.dataType]['SQLType'] = 'type';
      graph[column.dataType][_ + column.dataType] = 'name';
    }
  }
  return graph;
}

function calcInitialSimilarity(
  tablesLeft: Table[],
  tablesRight: Table[]
): Record<string, number> {
  const initialSimilarities: Record<string, number> = {};
  for (const leftTable of tablesLeft) {
    for (const rightTable of tablesRight) {
      initialSimilarities[`${leftTable.fullName}:${rightTable.fullName}`] =
        tableSimilarity(leftTable, rightTable);
      for (const leftCol of leftTable.columns) {
        for (const rightCol of leftTable.columns) {
          const left = columnIdentifier(leftTable, leftCol);
          const right = columnIdentifier(rightTable, rightCol);
          initialSimilarities[`${left}:${right}`] = colSimilarity(
            leftCol,
            rightCol
          );
          initialSimilarities[
            `${left}.${leftCol.dataType}:${right}.${rightCol.dataType}`
          ] = levenshteinDistance(leftCol.dataType, rightCol.dataType);
        }
      }
    }
  }
  return initialSimilarities;
}

function tableSimilarity(tableLeft: Table, tableRight: Table): number {
  return levenshteinDistance(tableLeft.name, tableRight.name);
}

function colSimilarity(colLeft: Column, colRight: Column): number {
  return (
    0.5 * levenshteinDistance(colLeft.name, colRight.name) +
    0.5 * levenshteinDistance(colLeft.dataType, colRight.dataType)
  );
}

/**
 * Distance of two strings
 * Code taken from https://www.30secondsofcode.org/js/s/levenshtein-distance
 * Scaled to (0,1)
 */
function levenshteinDistance(string1: string, string2: string): number {
  if (!string1.length) return string2.length;
  if (!string2.length) return string1.length;
  const arr = [];
  for (let i = 0; i <= string2.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= string1.length; j++) {
      arr[i][j] =
        i === 0
          ? j
          : Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              arr[i - 1][j - 1] + (string1[j - 1] === string2[i - 1] ? 0 : 1)
            );
    }
  }
  return (
    arr[string2.length][string1.length] /
    Math.max(string1.length, string2.length)
  );
}
function buildNewInitial(pcg: Graph<string>): Record<string, number> {
  const nodes = new Set<string>();
  const result: Record<string, number> = {};
  for (const start in pcg) {
    nodes.add(start);
    for (const end in pcg[start]) nodes.add(end);
  }

  for (const node of nodes) {
    const [left, right] = node.split(':');
    if (left.startsWith('_') && right.startsWith('_'))
      result[node] = levenshteinDistance(left.slice(1), right.slice(1));
  }
  return result;
}
