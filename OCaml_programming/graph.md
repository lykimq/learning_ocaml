# Graph

## Traversal Algorithms
- Depth-First Search (DFS): Explores as far as possible along each branch before backtracking.
- Breadth-First Search (BFS): Explores all neighbors at the present depth level before moving on to nodes at the next depth level.
## Shortest Path Algorithms
- Dijkstra's Algorithm: Finds the shortest path from a source node to all other nodes in a weighted graph with non-negative weights.
- Bellman-Ford Algorithm: Finds the shortest path from a source code to all other nodes in a graph with possibly negative weights. It can also detect negative weight cycles.
- Floye-Warshall Algorithm: Computes shortest paths between all pairs of nodes in a weighted graph, including handling negative weights (but not negative weight cycles).
- A search Algorith: An informed search algorithm that uses heuristics to improve search efficiency for finding the shortest path.
## Minimum Spanning Tree Algorithms
- Kruskal's Algorithm: Finds the minimum spanning tree (MST) by sorting all edges and adding the smallest edge to the MST that doesn't form a cycle.
- Prim's Algorithm: Builds the MST by starting from a single node and growing the MST one edge at a time.
## Network Flow Algorithms
## Graph Coloring Algorithms
## Topological Sorting Algorithms
- Kahn's Algorithm: Computes a topological sort of a directed acyclic graph (DAG) by repeatedly removing nodes with no incoming edges.
- Depth-First Search (DFS)-based Algorithm: Uses DFS to produce a topological sort by considering nodes in the reverse postorder of DFS.
## Strongly Connected Components Algorithms
- Kosaraju's Algorithm: Finds all strongly connected components in a directed graph using two passes of DFS.
- Tarjan's Algorithm: Finds SCC in a single DFS pass using a stack and depth-first search.
## Cycle Detection Algorithms
- DFS-based Cycle Detection: Uses depth-first search to find cycles in a graph (useful for both directed and undirected graphs).
- Union-Find Algorith: Can detect cycles in an undirected graph by managing connected components and detecting if adding an edge would form a cycle.
## Eulenrian Path and Circuit Algorithms
## Hamiltonian Path and Circuit Algorithms
## Graph Isomorphism Algorithms
## Graph Decomposition Algorithms
## Planarity Testing Algorithms
## Graph Matching Algorithms