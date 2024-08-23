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
```

## Red-Black Tree

A red-black tree is a type of self-balancing binary search tree (BST). It maintains balance through specific rules that help ensure the tree remains approximately balanced.

### Properties
A red-black tree must satisfy the following properties:
1. Node color: Each node is either black or red.
2. Root property: The root is always black.
3. Red property: red node cannot have red children or a red node has two black children.
4. Black depth property: every path from a node to its descendant null node must have the same number of black nodes.
5. Leaf property: every leaf (nil) is black.

### Advantages
- Balanced: Guarantees `O(log n)` time complexity for insertion, deletion and lookup.
- Less strick balance: compared to AVL trees, red-black trees have a more relaxed balancing, which can make insertions and deletions faster.

### Disadvantages
- More complex to implement: due to the multiple cases to handle during insertions and deletions.
- Slower lookup: slightly slower than AVL trees for lookup because AVL trees are more strictly balanced.

### Deletion
Delete can either have no children, one child, or two children.

Here are the steps involved in deleting a node in red-black tree:

1. If the node to be deleted has no children, simply remove it and update the parent node.
2. If the node to be deleted has only one child, replace the node with its child.
3. If the node to be deleted has two children, then replace the node with its in-order successor, which is the leftmost node in the right subtree. Then delete the in-order successor node as if it has at most one child.
4. After the node is deleted, the red-black properties might be violated. To restore these properties, some color changes and rotations are perfomred on the ndoes in the tree.
5. The deletion operation in red-black tree takes O(log n) times on average, making it a good choice for searching and deleting elements in large data sets.

#### Deletion steps
1. Perform standard BST delete. Let `v` be the node to be deleted, and `u` be the child that replaces `v`.
2. Simple case:
- If either `u` or `v` is red. We mark the replaced child as black.

```
       (B)30                               B(30)
        / \                                 / \
   v (B)20  40(B)    ---> delete 20     (B)10  40(B)
      /
 u (R)10
```
3. If both `u` and `v` are Black.
3.1. Color `u` as double black. If `v` is leaf, then `u` is null and color of null is black. So the deletion of the black leaf also causes a double black.

```
        (B)30                                        (B)30
         /  \                                       /     \
  v (B)20    40(B)        ---> delete 20      u (BB)nil   40(B)
      /\         \                                         \
  u nil nil       50(R)                                    50(R)

 This deletion is not done yet, this double black must become single back.
```

3.2. Do following while the current node `u` is double black, and it is not the root. Let sibling of node be `s`.

a. If sibling `s` is black and at least one of sibling's children is red => Perform rotation(s). Let the red child `s` be `r`. This case can be divided in 4 subcases depending upon positions of `s` and `r`

i. Left-left case: `s` is left child of its parents and `r` is left child of `s` or both children of `s` are red.
```
left-left
              (B)30 p
            /        \
    s   (B)20          40(B)
         /  \          /  \
    r (R)15 25(R)  (R)30   50(R)

```

ii. Left-right case: `s` is left child of its parents, `r` is right child.

```
left-right
          (B)30 p
            / \
       s (B)20
            \
            25(R) r

```

iii. Right-right case: `s` is right child of its parents and `r` is right child of `s` or both children of `s` are red.

```
right-right
         (B)30 p
             \
              40(B) s
              /  \
           (R)30   50(R) r

```
iv. Right-left case: (`s` is right child of its parent and `r` is the left child of `s`)

```
right-left
     (B)30 p
         \
          40(B) s
          /
         30(R) r
```

b. If sibling is black and its both children are black, perform recoloring, and recur for the parent if parent is black (if parent is red then we don't need to do that, we simple make it black. Red + double black = single red).

```
       20(B)p                               20(B)p
       /   \                                /  \
   v (B)10   30(B) s  --> delete 10   u(BB)nil   30(B)s
     / \       /  \                               /\
    nil nil   nil nil                          nil nil

Case 3.2.b sibling s is black, and both of its children are also black.
Recur for 20 to remove double black from it.

      20 (BB)p
      /  \
     nil 30(R)
          /\
        nil nil
```

c. If sibling is red, perform rotation to move old sibling up, recolor the old sibling and parent.

```
      (B)20 p                              (B)20 p
        /  \                               /      \
    v(B)10  30(R)s   ---> delete 10     u(BB)nil   30(R)s
            /    \                                   /  \
         25(B)  35(B)                             25(B) 35(B)

Case 3.2.c sibling is red, and right child of its parent. Perform rotation on parent

        30(B)
        /   \
    p(R)20    35(B)
     /    \
u (BB)nil  25(B)s

--> now it becomes case 3.2.b sibling is black, and both of its children are also black. recolor parent and sibling.

   30(B)
   /   \
(B)20   35(B)
  /  \
 nil  25(R)
```

3.3 If `u`  is root, make it single black and return.