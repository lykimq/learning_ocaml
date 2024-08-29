# Graph Algorithms

## 1. Traversal Algorithms

### 1.1 Depth-First Search (DFS)
- **Description**: Explores as far as possible along each branch before backtracking.
- **Approach**: Uses a stack (often implemented with recursion) to visit nodes.
- **Use Cases**: Useful for finding connected components, detecting cycles, and solving maze problems.

### 1.2 Breadth-First Search (BFS)
- **Description**: Explores all neighbors at the present depth level before moving on to nodes at the next depth level.
- **Approach**: Uses a queue to visit nodes level by level.
- **Use Cases**: Useful for finding the shortest path in an unweighted graph, level-order traversal, and finding connected components.

---

## 2. Shortest Path Algorithms

### 2.1 Dijkstra's Algorithm
- **Description**: Finds the shortest path from a source node to all other nodes in a weighted graph with non-negative weights.
- **Approach**: Uses a priority queue (min-heap) to iteratively select the nearest unvisited node.
- **Use Cases**: Finding the shortest path in maps, routing, and network protocols.

### 2.2 Bellman-Ford Algorithm
- **Description**: Finds the shortest path from a source node to all other nodes in a graph with possibly negative weights. It can also detect negative weight cycles.
- **Approach**: Iterates through all edges up to `V-1` times (`V` is the number of vertices), relaxing the edges.
- **Use Cases**: Useful when dealing with graphs that have negative weights, like in financial arbitrage or currency exchange problems.

### 2.3 Floyd-Warshall Algorithm
- **Description**: Computes shortest paths between all pairs of nodes in a weighted graph, including handling negative weights (but not negative weight cycles).
- **Approach**: Uses dynamic programming to update paths, considering each node as an intermediate.
- **Use Cases**: All-pairs shortest path problems, especially in dense graphs.

### 2.4 A* Search Algorithm
- **Description**: An informed search algorithm that uses heuristics to improve search efficiency for finding the shortest path.
- **Approach**: Combines the cost to reach the node and a heuristic estimate of the cost to the goal (often implemented with a priority queue).
- **Use Cases**: Pathfinding in games, AI, and robotics, where an optimal and efficient search is needed.

---

## 3. Minimum Spanning Tree (MST) Algorithms

### 3.1 Kruskal's Algorithm
- **Description**: Finds the minimum spanning tree by sorting all edges and adding the smallest edge to the MST that doesn't form a cycle. It is used in a connected, undirected graph.
- **Approach**:
  1. Sort all the edges in non-decreasing order of their weight.
  2. Initialize the MST as an empty set.
  3. Iterate through the sorted edge list:
     - For each edge, if adding it to the MST does not form a cycle, add it to the MST.
     - Use a Union-Find (or Disjoint-Set) data structure to efficiently manage the sets of vertices.
  4. Stop when the MST has `V-1` edges, where `V` is the number of vertices in the graph.
- **Use Cases**: Network design, clustering, and constructing minimum cost spanning trees.

### 3.2 Prim's Algorithm
- **Description**: Builds the MST by starting from a single node and growing the MST one edge at a time.
- **Approach**:
  - Start with a single node and repeatedly add the smallest edge that connects a node in the MST to a node outside the MST.
  - Use a priority queue to select the smallest edge efficiently.
- **Use Cases**: Network design, particularly in sparse graphs, and connecting disparate systems.

---

## 4. Network Flow Algorithms
- **Overview**: Algorithms that calculate the optimal flow through a network, maximizing the amount of flow from a source node to a sink node while respecting capacity constraints.

---

## 5. Graph Coloring Algorithms
- **Overview**: Algorithms that assign colors to the vertices of a graph such that no two adjacent vertices have the same color. Often used in scheduling, register allocation in compilers, and map coloring.

---

## 6. Topological Sorting Algorithms

### 6.1 Kahn's Algorithm
- **Description**: Computes a topological sort of a directed acyclic graph (DAG) by repeatedly removing nodes with no incoming edges.
- **Approach**:
  - Identify nodes with no incoming edges.
  - Remove these nodes and update the graph.
  - Repeat until all nodes are removed or a cycle is detected.
- **Use Cases**: Scheduling tasks, resolving symbol dependencies in compilers.

### 6.2 DFS-based Algorithm
- **Description**: Uses DFS to produce a topological sort by considering nodes in the reverse postorder of DFS.
- **Approach**:
  - Perform a DFS on the graph.
  - Record the nodes in the order they finish.
  - Reverse the recorded order to get the topological sort.
- **Use Cases**: Dependency resolution, task scheduling in parallel processing.

---

## 7. Strongly Connected Components (SCC) Algorithms

### 7.1 Kosaraju's Algorithm
- **Description**: Finds all strongly connected components in a directed graph using two passes of DFS.
- **Approach**:
  - Perform a DFS on the graph and store nodes by their finishing times.
  - Reverse the graph's edges.
  - Perform DFS in the order of decreasing finishing times to identify SCCs.
- **Use Cases**: Identifying components in directed graphs where every vertex is reachable from every other vertex.

### 7.2 Tarjan's Algorithm
- **Description**: Finds SCC in a single DFS pass using a stack and depth-first search.
- **Approach**:
  - Perform DFS, tracking discovery times and using a stack to maintain the current path.
  - Identify SCCs when backtracking in DFS.
- **Use Cases**: Component analysis in software modules, circuit design, and network analysis.

---

## 8. Cycle Detection Algorithms

### 8.1 DFS-based Cycle Detection
- **Description**: Uses depth-first search to find cycles in a graph, useful for both directed and undirected graphs.
- **Approach**:
  - During DFS, track the visited nodes and detect cycles by checking if a node is revisited.
- **Use Cases**: Identifying infinite loops in programs, deadlock detection, and circular dependencies.

### 8.2 Union-Find Algorithm
- **Description**: Can detect cycles in an undirected graph by managing connected components and detecting if adding an edge would form a cycle.
- **Approach**:
  - Use the Union-Find data structure to keep track of the connected components.
  - If an edge connects two nodes in the same component, a cycle is detected.
- **Use Cases**: Network design, detecting loops in electrical circuits.

---

## 9. Eulerian Path and Circuit Algorithms
- **Overview**: Algorithms for finding Eulerian paths (visiting every edge exactly once) and Eulerian circuits (an Eulerian path that starts and ends at the same vertex) in a graph.

---

## 10. Hamiltonian Path and Circuit Algorithms
- **Overview**: Algorithms for finding Hamiltonian paths (visiting every vertex exactly once) and Hamiltonian circuits (a Hamiltonian path that starts and ends at the same vertex) in a graph.

---

## 11. Graph Isomorphism Algorithms
- **Overview**: Algorithms that determine if two graphs are isomorphic, meaning they contain the same number of graph vertices connected in the same way.

---

## 12. Graph Decomposition Algorithms
- **Overview**: Algorithms that break a graph into simpler components, such as biconnected components, triconnected components, or into trees, for easier analysis.

---

## 13. Planarity Testing Algorithms
- **Overview**: Algorithms that test whether a graph can be embedded in the plane without any edges crossing, and if so, produce such an embedding.

---

## 14. Graph Matching Algorithms
- **Overview**: Algorithms that find a matching in a graph, where a matching is a set of edges without common vertices. This is used in network flows, job assignments, and more.
