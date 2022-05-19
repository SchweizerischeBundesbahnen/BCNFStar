// import Column from './Column';
// import Schema from './Schema';
// import Table from './Table';

import Column from './Column';
import Table from './Table';

type Graph<LabelType> = Record<string, Record<string, LabelType>>;

function columnIdentifier(table: Table, col: Column) {
  return `${table.fullName}.${col.name}`;
}

/**
 *
 * @param graph Record<label, start,end>
 */
function buildPCG(graphLeft: Graph<string>, graphRight: Graph<string>) {
  const pcg: Graph<string> = {};
  for (const label in graphLeft) {
    const labelLevel: typeof pcg[0] = (pcg[label] = {});
    for (const startLeft in graphLeft[label]) {
      for (const startRight in graphRight[label]) {
        const start = `${startLeft}:${startRight}`;
        const end = `${labelLevel[startLeft]}:${labelLevel[startRight]}`;
        labelLevel[start] = end;
      }
    }
  }
  return pcg;
}
/**
 *
 * @param pcg
 * @returns Record<start,Record<end, propagation value>
 */
function buildIPG(pcg: Graph<string>) {
  const ipg: Graph<number> = {};
  for (const label in pcg) {
    const labelLevel: typeof pcg[0] = pcg[label];
    const startCounts: Record<string, number> = {};
    const endCounts: Record<string, number> = {};
    for (const start in labelLevel)
      startCounts[start] = startCounts[start] + 1 || 1;
    for (const end in Object.values(labelLevel))
      endCounts[end] = endCounts[end] + 1 || 1;
    for (const start in labelLevel) {
      const end = labelLevel[start];
      if (!ipg[start]) ipg[start] = {};
      if (!ipg[end]) ipg[end] = {};
      ipg[start][end] = (ipg[start][end] || 0) + 1.0 / startCounts[start];
      ipg[end][start] = (ipg[end][start] || 0) + 1.0 / endCounts[end];
    }
  }
  return ipg;
}

function propagate(
  ipg: Graph<number>,
  initial: Record<string, number>,
  last: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  const contribution = (node: string) => last[node] + initial[node];
  for (const start in ipg) {
    result[start] = contribution(start);
    for (const end in ipg[start]) {
      const propagationVal = ipg[start][end];
      result[start] += propagationVal * contribution(end);
    }
  }
  return result;
}
function filter(flooded: Record<string, number>, selectThreshold = 0.999) {
  // leftName, rightName, score
  const maxSimilarity: Record<string, number> = {};
  for (const [name, sim] of Object.entries(flooded)) {
    const [left, right] = name.split(':');
    maxSimilarity[left] = Math.max(maxSimilarity[left], sim);
    maxSimilarity[right] = Math.max(maxSimilarity[right], sim);
  }
  const relativeSimilarities: Record<string, Record<string, number>> = {};
  for (const [name, sim] of Object.entries(flooded)) {
    const [left, right] = name.split(':');
    if (!relativeSimilarities[left]) relativeSimilarities[left] = {};
    if (
      sim / maxSimilarity[left] > selectThreshold &&
      sim / maxSimilarity[right] > selectThreshold
    ) {
      relativeSimilarities[left][right] = sim;
    }
  }

  return relativeSimilarities;
}

function matchSchemas(tablesLeft: Array<Table>, tablesRight: Array<Table>) {
  const graphLeft = createGraph(tablesLeft);
  const graphRight = createGraph(tablesRight);
  const initialSimliarity = calcInitialSimilarity(tablesLeft, tablesRight);
  const flooded = similarityFlood(graphLeft, graphRight, initialSimliarity);
  const filtered = filter(flooded);
  return filtered;
}

function similarityFlood(
  graphLeft: Graph<string>,
  graphRight: Graph<string>,
  initial: Record<string, number>
) {
  const pcg = buildPCG(graphLeft, graphRight);
  const ipg = buildIPG(pcg);
  const threshold = 0.000_000_001;
  let last: Record<string, number> = initial;
  let current: Record<string, number>;
  let difference;
  do {
    current = propagate(ipg, initial, last);
    last = current;
    // calculating change by computing the length of the residual vector
    const residualVector = Object.keys(current).map(
      (node) => current[node] - last[node]
    );
    difference = Math.sqrt(
      residualVector.reduce((prev, curr) => prev + curr * curr)
    );
  } while (difference > threshold);
  return current;
}

function createGraph(tables: Table[]): Graph<string> {
  const graph: Graph<string> = {
    table: {},
    column: {},
    type: {},
    // name: {},
    // SQLType: {},
  };

  for (const table of tables) {
    graph['table']['schema'] = table.fullName;
    for (const column of table.columns) {
      const colNode = columnIdentifier(table, column);
      graph['column'][table.fullName] = colNode;
      graph['type'][colNode] = colNode + column.dataType;
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
