// WIP, to be completed and reviewed later

// import Column from './Column';
// import Schema from './Schema';
// import Table from './Table';

// // interface PCGNode<T> {
// //   elLeft: T;
// //   elRight: T;
// // }

// // interface PCGEdge<S, F> {
// //   start: PCGNode<S>;
// //   end: PCGNode<F>;
// //   label: string;
// // }

// export default function matchSchemas(schemaLeft: Schema, schemaRight: Schema) {
//   const result = similarityFlooding(schemaLeft, schemaRight);
//   const absoluteSimilarities: Record<string, Record<string, number>> = {};
//   for (const node in result) {
//     const [, start, end] = node.split(':');
//     if (!absoluteSimilarities[start]) absoluteSimilarities[start] = {};
//     absoluteSimilarities[start][end] = result[node];
//   }
//   const relativeSimilarities: Record<string, Record<string, number>> = {};

//   const selectTreshold = 1.0;

//   for (const start in absoluteSimilarities) {
//     relativeSimilarities[start] = {};
//     const max = Math.max(...Object.values(absoluteSimilarities[start]));
//     for (const end in absoluteSimilarities) {
//       const val = absoluteSimilarities[start][end] / max;
//       if (val > selectTreshold) relativeSimilarities[start][end] = val;
//     }
//   }
//   return result;
// }

// // class Graph {
// //     forward: Record<string, Graph> = {}
// //     reverse: Record<string, Graph> = {}
// //     constructor(public label: string) { }

// //     addChild(label: string, ...path: string[]) {
// //         if (path.length) {
// //             this.getChild(...path).addChild(label)
// //         }
// //         else {
// //             const g = new Graph(label)
// //             this.forward[label] = g;
// //             g.reverse[this.label] = this;
// //         }
// //     }
// //     getChild(...path: string[]): Graph {
// //         if (path.length == 1) return this.forward[path[0]]
// //         return this.forward[path[0]].getChild(...path.slice(1))
// //     }
// // }

// /**
//  *
//  * @param schemaLeft
//  * @param schemaRight
//  * @returns elements mapped to their similarity
//  */
// function similarityFlooding(
//   schemaLeft: Schema,
//   schemaRight: Schema
// ): Record<string, number> {
//   // <start,<end>>
//   const PCG: Record<string, Set<string>> = {};
//   const reversePCG: Record<string, Set<string>> = {};
//   PCG['schema:left:right'] = new Set();
//   const initialSimilarity: Record<string, number> = {};
//   initialSimilarity['schema:left:right'] = 0;
//   // building PCG
//   for (const tableLeft of schemaLeft.tables) {
//     for (const tableRight of schemaRight.tables) {
//       const tableIdentifier = `table:${tableLeft.fullName}:${tableRight.fullName}`;
//       PCG['schema:left:right'].add(tableIdentifier);
//       PCG[tableIdentifier] = new Set();
//       reversePCG[tableIdentifier] = new Set(['schema:left:right']);
//       initialSimilarity[tableIdentifier] = tableSimilarity(
//         tableLeft,
//         tableRight
//       );
//       for (const colLeft of tableLeft.columns) {
//         for (const colRight of tableRight.columns) {
//           const colIdentifier = `col:${colLeft.name}:${colRight.name}`;
//           PCG[tableIdentifier].add(colIdentifier);
//           if (!reversePCG[colIdentifier]) reversePCG[colIdentifier] = new Set();
//           reversePCG[colIdentifier].add(tableIdentifier);
//           initialSimilarity[colIdentifier] = colSimilarity(colLeft, colRight);
//         }
//       }
//     }
//   }

//   let changeAmount = 1;
//   const threshold = 0.0001;
//   let currentSimilarity: Record<string, number> = initialSimilarity;
//   let prevSimilarity: Record<string, number> = {};

//   const propagate = (graph: Record<string, Set<string>>, node: string) =>
//     [...graph[node]].reduce(
//       (acc, el) => acc + initialSimilarity[el] + prevSimilarity[el],
//       0
//     );

//   while (changeAmount > threshold) {
//     let biggestValThisRound = 0;
//     prevSimilarity = currentSimilarity;
//     currentSimilarity = {};
//     for (const node of Object.keys(PCG)) {
//       currentSimilarity[node] =
//         prevSimilarity[node] +
//         initialSimilarity[node] +
//         // / size to apply propagation coefficients
//         propagate(PCG, node) / PCG[node].size +
//         propagate(reversePCG, node) / reversePCG[node].size;
//       biggestValThisRound = Math.max(
//         biggestValThisRound,
//         currentSimilarity[node]
//       );
//     }
//     // normalization
//     for (const node in currentSimilarity) {
//       currentSimilarity[node] /= biggestValThisRound;
//     }
//     // calculating change by computing the length of the residual vector
//     const residualVector = Object.keys(currentSimilarity).map(
//       (node) => currentSimilarity[node] - prevSimilarity[node]
//     );
//     changeAmount = Math.sqrt(
//       residualVector.reduce((prev, curr) => prev + curr * curr)
//     );
//   }
//   return currentSimilarity;
// }

// function tableSimilarity(tableLeft: Table, tableRight: Table): number {
//   return levenshteinDistance(tableLeft.name, tableRight.name);
// }

// function colSimilarity(colLeft: Column, colRight: Column): number {
//   return (
//     0.5 * levenshteinDistance(colLeft.name, colRight.name) +
//     0.5 * levenshteinDistance(colLeft.dataType, colRight.dataType)
//   );
// }

// /**
//  * Distance of two strings
//  * Code taken from https://www.30secondsofcode.org/js/s/levenshtein-distance
//  * Scaled to (0,1)
//  */
// function levenshteinDistance(string1: string, string2: string): number {
//   if (!string1.length) return string2.length;
//   if (!string2.length) return string1.length;
//   const arr = [];
//   for (let i = 0; i <= string2.length; i++) {
//     arr[i] = [i];
//     for (let j = 1; j <= string1.length; j++) {
//       arr[i][j] =
//         i === 0
//           ? j
//           : Math.min(
//               arr[i - 1][j] + 1,
//               arr[i][j - 1] + 1,
//               arr[i - 1][j - 1] + (string1[j - 1] === string2[i - 1] ? 0 : 1)
//             );
//     }
//   }
//   return (
//     arr[string2.length][string1.length] /
//     Math.max(string1.length, string2.length)
//   );
// }
