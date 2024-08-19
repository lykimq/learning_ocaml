# Trees

## 1. Introduction to Trees.

A **tree** is a widely used abstract data type (ADT) in programming that simulates a hierarchial tree structure. A tree consits of nodes connected by edges, where:
- Node: The basic unit of a tree, containing data and links to other nodes.
- Edge: The connection between two nodes.
- Root: The topmost node of the tree, where the hierarchy begins.
- Leaf: A node that does not have any children.
- Child: A node directly connected to another node when moving away from the root.
- Parent: A node directly connected to another node when moving towards the root.

2. Types of trees:
- Binary Tree: Each node has at most two children.
- Binary Search Tree (BST): A binary tree where the left child contains only nodes with values less than the parent node, and the right child only nodes with values greater than the parent node.
- AVL Tree: a self-balancing binary search tree where the difference between heights of left and right subtrees cannot be more than one.
- B-Tree: A self-balancing tree data structure that maintains sorted data and allows searchs, sequential access, insertions and deletions in logarithmic time.
- Red-Black Tree: A self-balancing binary search tree where each node contains an extra bit for denoting the color of the node, either red or black.
- Trie: A tree-like data structure that stores a dynamic set of strings, usually used for searching words in a dictionary.

3. Operations on Trees:
- Insertion: Adding a node in a specific position.
- Deletion: Removing a node while maintaining the structure of the tree.
- Traversal: Visiting all the nodes in some order (Pre-order, In-order, Post-order).
- Search: Finding a node with a specific value.
- Balancing: Rearranging nodes to ensure the tree is balanced for optimal operations.

4. Applications of Trees:
- File system: directory structure.
- Databases: B-tree and B+trees are used in databases for indexing.
- Networking: Routers use tree structures to store routing information.
- Compilers: Abstract Syntax Trees (AST) are used to represent the structure of source code.

## 2. Tree traversal methods: In-order, pre-order, post-order

Tree traversal refers to the process of visiting all the nodes in a tree in a specific order. The most common types of tree traversal are In-order, Pre-order, Post-order. Below is a breakdown of each traversal method with an example:

**Example Tree**

Let's consider the following binary tree:

```m
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

Here, the root of the tree is `4`, with `2` and `6` as its left and right children, respectively.

a. In-order traversal (Left, Root, Right)
In an in-order traversal, you visit the left subtree first, then the root node, and finally the right subtree.

**Steps for in-order traversal**
- Traverse the left subtree by recursively applying in-order traversal.
- Visit the root node.
- Traverse the right subtree by recursively applying in-order traversal.

In-order result: `1, 2, 3, 4, 5, 6, 7`

b. Pre-order traversal (Root, Left, Right):
In a pre-order traversal, you visit the root first, then the left subtree, and finally the right subtree.

**Steps for pre-order traversal**
- Visit the root node.
- Traverse the left subtree by recursively applying pre-order traversal.
- Traverse the right subtree by recursively applying pre-order traversal.

Pre-order result: `4, 2, 1, 3, 6, 5, 7`

c. Post-order traversal (Left, Right, Root)
In a post-order traversal, you visit the left subtree first, then the right subtree and finally the root node.

 **Steps for post-order traversal**
 - Traverse the left subtree by recursively applying post-order traversal.
 - Traverse the right subtree by recursively applying post-order traversal.
 - Visit the root node.

 Post-order result: `1, 3, 2, 5, 7, 6, 4`

## AVL tree

### Properties

#### Left Rotate (LL)
- Before rotation
    - Node A: the current root node.
    - Node B: the right child of node A. Node B has become taller, causing an imbalance.

- After rotation:
    - Node B becomes the new root.
    - Node A becomes the left child of node B.
    - Any left subtree of B (if it exits) becomes the right child of node A.


```md
The balance factor of 30 is -2
   30                 40
   /\     -->         /\
     40              30 50
      \
      50
```

#### Right rotation (RR)
- Before rotation
    - Node A: the current root node.
    - Node B: the left child of node A. Node B has become taller, causing an imbalance.
- After rotation:
    - Node B: become the new root.
    - Node A: become right child of node B.
    - Any right subtree of B (if exits) become the left child of node A.

```md
The balance factor of 30 is 2
   30A                 20B
   /\     -->          /\
 20B                  10C 30A
 /  \                      /
10C  25D                  25D
```

#### Left-Right rotation
- Before rotation:
    - Node A: the current root node.
    - Node B: the left child of node A.
    - Node C: the right child of node B. node C has become taller, causing an imbalance.
- After rotation:
    - Node C becomes the new root
    - Node B becomes the left child of node C.
    - Node A becomes the right child of node C.
    - Any left subtree of C (if it exists) become the right child of node B

```md
   30A                 20C
   /\     -->          /\
 10B                  10B 30A
   \                   \
   20C                  D
   /
   D
```

#### Right-Left rotation
- Before the rotation
    - Node A: the current root node.
    - Node B: the right child of node A.
    - Node C: The left child of node B. Node C has become taller, causing an imbalance.
- After the rotation:
    - Node C becomes new root node.
    - Node B becomes right child of node C.
    - Node A becomes left child of node C.
    - Any right subtree of node C (if it exist) becomes the left child of node B


```md
   10A                 20C
    \     -->          /\
    30B              10A 30B
    /                     /
   20C                   25D
    \
    25D