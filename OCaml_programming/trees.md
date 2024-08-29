# Trees

## 1. Introduction to Trees

A **tree** is a widely used abstract data type (ADT) that simulates a hierarchical tree structure. It consists of nodes connected by edges, where:

- **Node**: The basic unit of a tree, containing data and links to other nodes.
- **Edge**: The connection between two nodes.
- **Root**: The topmost node of the tree, where the hierarchy begins.
- **Leaf**: A node that does not have any children.
- **Child**: A node directly connected to another node when moving away from the root.
- **Parent**: A node directly connected to another node when moving towards the root.

### 1.1 Types of Trees

- **Binary Tree**: Each node has at most two children.
- **Binary Search Tree (BST)**: A binary tree where the left child contains only nodes with values less than the parent node, and the right child contains only nodes with values greater than the parent node.
- **AVL Tree**: A self-balancing binary search tree where the difference between heights of the left and right subtrees cannot be more than one.
- **B-Tree**: A self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.
- **Red-Black Tree**: A self-balancing binary search tree where each node contains an extra bit denoting the color of the node, either red or black.
- **Trie**: A tree-like data structure that stores a dynamic set of strings, usually used for searching words in a dictionary.

### 1.2 Operations on Trees

- **Insertion**: Adding a node in a specific position.
- **Deletion**: Removing a node while maintaining the structure of the tree.
- **Traversal**: Visiting all the nodes in some order (Pre-order, In-order, Post-order).
- **Search**: Finding a node with a specific value.
- **Balancing**: Rearranging nodes to ensure the tree is balanced for optimal operations.

### 1.3 Applications of Trees

- **File System**: Directory structure.
- **Databases**: B-trees and B+trees are used in databases for indexing.
- **Networking**: Routers use tree structures to store routing information.
- **Compilers**: Abstract Syntax Trees (AST) are used to represent the structure of source code.

---

## 2. Tree Traversal Methods: In-order, Pre-order, Post-order

Tree traversal refers to the process of visiting all the nodes in a tree in a specific order. The most common types of tree traversal are **In-order**, **Pre-order**, and **Post-order**.

### 2.1 Example Tree

Consider the following binary tree:

```
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

- The root of the tree is `4`, with `2` and `6` as its left and right children, respectively.

### 2.2 In-order Traversal (Left, Root, Right)

In an **in-order traversal**, you visit the left subtree first, then the root node, and finally the right subtree.

**Steps for In-order Traversal**:
1. Traverse the left subtree by recursively applying in-order traversal.
2. Visit the root node.
3. Traverse the right subtree by recursively applying in-order traversal.

**In-order result**: `1, 2, 3, 4, 5, 6, 7`

### 2.3 Pre-order Traversal (Root, Left, Right)

In a **pre-order traversal**, you visit the root first, then the left subtree, and finally the right subtree.

**Steps for Pre-order Traversal**:
1. Visit the root node.
2. Traverse the left subtree by recursively applying pre-order traversal.
3. Traverse the right subtree by recursively applying pre-order traversal.

**Pre-order result**: `4, 2, 1, 3, 6, 5, 7`

### 2.4 Post-order Traversal (Left, Right, Root)

In a **post-order traversal**, you visit the left subtree first, then the right subtree, and finally the root node.

**Steps for Post-order Traversal**:
1. Traverse the left subtree by recursively applying post-order traversal.
2. Traverse the right subtree by recursively applying post-order traversal.
3. Visit the root node.

**Post-order result**: `1, 3, 2, 5, 7, 6, 4`

---

## 3. AVL Tree

An **AVL Tree** is a self-balancing binary search tree where the height of the left and right subtrees of any node differ by at most one.

### 3.1 Properties of AVL Trees

#### Left Rotation (LL)

- **Before rotation**:
  - Node A: The current root node.
  - Node B: The right child of node A. Node B has become taller, causing an imbalance.

- **After rotation**:
  - Node B becomes the new root.
  - Node A becomes the left child of node B.
  - Any left subtree of B (if it exists) becomes the right child of node A.

```
The balance factor of 30 is -2
    30                     40
     \        -->         /  \
     40                 30    50
      \
      50
```

#### Right Rotation (RR)

- **Before rotation**:
  - Node A: The current root node.
  - Node B: The left child of node A. Node B has become taller, causing an imbalance.

- **After rotation**:
  - Node B becomes the new root.
  - Node A becomes the right child of node B.
  - Any right subtree of B (if it exists) becomes the left child of node A.

```
The balance factor of 30 is 2
    30A                   20B
   /        -->           /  \
 20B                     10C  30A
 /  \                          /
10C  25D                     25D
```

#### Left-Right Rotation (LR)

- **Before rotation**:
  - Node A: The current root node.
  - Node B: The left child of node A.
  - Node C: The right child of node B. Node C has become taller, causing an imbalance.

- **After rotation**:
  - Node C becomes the new root.
  - Node B becomes the left child of node C.
  - Node A becomes the right child of node C.
  - Any left subtree of C (if it exists) becomes the right child of node B.

```
    30A                20C
   /       -->         /  \
 10B                  10B  30A
   \                   \
   20C                 D
   /
   D
```

#### Right-Left Rotation (RL)

- **Before rotation**:
  - Node A: The current root node.
  - Node B: The right child of node A.
  - Node C: The left child of node B. Node C has become taller, causing an imbalance.

- **After rotation**:
  - Node C becomes the new root.
  - Node B becomes the right child of node C.
  - Node A becomes the left child of node C.
  - Any right subtree of C (if it exists) becomes the left child of node B.

```
    10A                 20C
     \       -->        /  \
     30B               10A  30B
     /                      /
    20C                    25D
     \
     25D
```

---

## 4. Red-Black Tree

A **Red-Black Tree** is a type of self-balancing binary search tree (BST) that maintains balance through specific rules, ensuring the tree remains approximately balanced.

### 4.1 Properties of Red-Black Trees

A red-black tree must satisfy the following properties:

1. **Node Color**: Each node is either black or red.
2. **Root Property**: The root is always black.
3. **Red Property**: A red node cannot have red children (i.e., no two consecutive red nodes).
4. **Black Depth Property**: Every path from a node to its descendant null node must have the same number of black nodes.
5. **Leaf Property**: Every leaf (null node) is black.

### 4.2 Advantages of Red-Black Trees

- **Balanced**: Guarantees `O(log n)` time complexity for insertion, deletion, and lookup.
- **Less Strict Balance**: Compared to AVL trees, red-black trees have more relaxed balancing, which can make insertions and deletions faster.

### 4.3 Disadvantages of Red-Black Trees

- **More Complex to Implement**: Due to the multiple cases to handle during insertions and deletions.
- **Slower Lookup**: Slightly slower than AVL trees for lookup because AVL trees are more strictly balanced.

### 4.4 Deletion in Red-Black Trees

Deletion in a red-black tree can involve three scenarios: no children, one child, or two children. Here are the steps involved in deleting a node in a red-black tree:

1. **No Children**: If the node to be deleted has no children, simply remove it and update the parent node.
2. **One Child**: If the node to be deleted has only one child, replace the node with

 its child.
3. **Two Children**: If the node to be deleted has two children, find the in-order predecessor or successor, replace the node with it, and then delete the predecessor/successor node.

### 4.5 Rebalancing After Deletion

After deletion, the tree may become unbalanced. To restore the red-black properties, various rotations and color flips may be required.

### 4.6 Rotations and Recoloring

- **Left Rotation**: A node becomes the left child of its right child.
- **Right Rotation**: A node becomes the right child of its left child.
- **Recoloring**: Switching the colors of nodes to maintain red-black properties.

### 4.7 Example Scenario

Consider the deletion of node `30` in the following Red-Black Tree:

```
Before deletion:
         40(B)
        /   \
      20(B)  60(R)
     /   \   /  \
   10(B) 30(B) 50(B) 70(B)

After deletion of 30:
         40(B)
        /   \
      20(B)  60(R)
     /         \
   10(B)        50(B) 70(B)
```

- Node `30` is removed.
- The tree remains balanced without any further rotation or recoloring.

## 5. Trie Tree

### 5.1 What is a Trie Tree?

A **Trie Tree**, often just called a **Trie** (pronounced as "try"), is a type of data structure that is used to store a dynamic set of strings, where the keys are usually strings. Tries are particularly useful when you need to perform fast string searches, like looking up words in a dictionary, autocomplete systems, or spell checkers.

### 5.2 Structure of a Trie

A Trie is a type of tree structure where:

- Each **node** represents a single character of a string.
- The root node represents the empty string.
- Each path down the tree may represent a word.
- Each edge represents the next character of the word.
- The nodes that are connected from the root to a leaf node form a word.

### 5.3 Properties of a Trie

1. **Each node can have multiple children**: Each child corresponds to a character in the alphabet.
2. **Words are formed by tracing paths from the root to a leaf or a node marked as the end of a word**.
3. **Common prefixes are stored only once**: This makes tries very space-efficient when dealing with large sets of strings that share common prefixes.

### 5.4 Example: Building a Trie

Let's build a Trie for the words: "cat", "car", "dog", "dot".

1. **Start with an empty root node**.
2. **Insert "cat"**:
   - The root node has no children, so we add 'c'.
   - From 'c', add 'a'.
   - From 'a', add 't'.
   - Mark the node containing 't' as the end of a word.

3. **Insert "car"**:
   - 'c' already exists under the root.
   - 'a' already exists under 'c'.
   - 'r' is new, so add 'r' under 'a' and mark it as the end of the word.

4. **Insert "dog"**:
   - 'd' is new under the root, so add 'd'.
   - From 'd', add 'o'.
   - From 'o', add 'g' and mark it as the end of the word.

5. **Insert "dot"**:
   - 'd' already exists under the root.
   - 'o' already exists under 'd'.
   - 't' is new under 'o', so add 't' and mark it as the end of the word.

Here's what the Trie looks like after inserting all the words:

```
        (root)
         /   \
        c     d
       / \   / \
      a   o o   o
     / \    \    \
    t   r    g    t
```

- The path `c -> a -> t` forms the word "cat".
- The path `c -> a -> r` forms the word "car".
- The path `d -> o -> g` forms the word "dog".
- The path `d -> o -> t` forms the word "dot".

### 5.5 Operations on a Trie

1. **Insert a Word**: Start from the root and follow the path corresponding to the characters of the word. If a character path doesn’t exist, create a new node. Mark the last node as the end of the word.

2. **Search for a Word**: Start from the root and follow the path corresponding to the characters of the word. If you can follow the path and the last node is marked as the end of the word, then the word exists in the Trie.

3. **Prefix Search**: Similar to searching for a word, but you don’t need to check if the last node is marked as the end of a word. You just need to be able to follow the path.

4. **Deletion of a Word**: This is more complex because you need to ensure you don't break the paths for other words that share the same prefix. Typically, you'd only remove nodes that don't lead to any other word.

### 5.6 Applications of Trie

1. **Autocomplete**: Tries are often used in search engines and text editors to suggest words as you type.
2. **Spell Checking**: Fast lookup of words makes them ideal for spell checkers.
3. **IP Routing**: Tries can be used to route internet traffic efficiently.
4. **Prefix Matching**: Useful in many string processing algorithms, where you need to match strings that share a common prefix.

### 5.7 Advantages of a Trie

- **Fast Search**: Searching in a Trie is fast because you are directly going to the next character without comparing it.
- **Efficient Prefix Search**: Because common prefixes are shared, searching for a prefix is more efficient.

### 5.8 Disadvantages of a Trie

- **Space Complexity**: While Tries can be space-efficient for shared prefixes, they can also use a lot of space when many words don't share common prefixes.
- **Implementation Complexity**: They can be more complex to implement compared to other data structures like hash maps.

### 5.9 Conclusion

A Trie is a powerful data structure for managing strings, especially when you need efficient prefix-based searches. It's widely used in various applications from dictionary implementations to routing algorithms and beyond. Understanding how a Trie works can help you solve many string-related problems more efficiently.


## 6 Patricia Tree
A Patricia Tree (Practical Algorithm to Retrieve Information Coded in Alphanumeric) is a data structure used for storing and retrieving strings efficiently. It’s a type of trie (pronounced “try”), which is a tree-like structure that organizes strings by their common prefixes. Here’s a breakdown of how Patricia Trees work:

### 6.1 Key Concepts

1. **Trie Basics:**
   - A trie is a tree where each node represents a common prefix of some strings. For example, the strings “cat”, “cap”, and “car” would share common prefixes in the trie structure.

2. **Patricia Tree:**
   - Patricia Trees, also known as Patricia Tries, are a compressed version of tries. In a standard trie, each node represents a single character, but in a Patricia Tree, nodes can represent strings (substrings) instead of single characters. This compression reduces the number of nodes and edges in the tree.

### 6.2 Structure

- **Nodes:**
  - In a Patricia Tree, each node represents a string that may be several characters long. Nodes are usually labeled with the string they represent.

- **Edges:**
  - Edges between nodes represent the remaining part of the string after accounting for the string in the node. For example, if one node represents “ca” and another represents “cat”, the edge between them might be “t”.

### 6.3 Insertion

- To insert a string into a Patricia Tree:
  1. Start at the root.
  2. Traverse down the tree, comparing the string with the labels of the nodes along the path.
  3. If a mismatch is found, split the existing edge and add the new string accordingly, updating the tree structure.

### 6.4 Searching

- To search for a string:
  1. Start at the root.
  2. Traverse down the tree following the labels and edges, checking if the string matches the labels along the path.
  3. If you find a matching path from the root to a node, the string exists in the tree.

### 6.5 Advantages

- **Space Efficiency:** Patricia Trees are more space-efficient compared to standard tries because they compress common prefixes.
- **Faster Lookups:** They can provide faster search times compared to standard tries, especially when the number of nodes is reduced through compression.

### 6.6 Applications

- **IP Routing:** Patricia Trees are often used in network routing algorithms to efficiently store and retrieve IP addresses.
- **Text Processing:** They are used in applications requiring efficient string matching and storage, like autocomplete features and dictionary implementations.

In summary, a Patricia Tree is a space-optimized version of a trie that efficiently handles string storage and retrieval by compressing nodes and reducing redundancy in common prefixes.