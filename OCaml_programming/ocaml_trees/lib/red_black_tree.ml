module Red_Back_Tree : sig
  type color = Red | Black

  type 'a tree =
    | Empty
    | Node of { color : color; value : 'a; left : 'a tree; right : 'a tree }

  val empty : 'a tree
  val insert : 'a -> 'a tree -> 'a tree
  val search : 'a tree -> 'a -> bool
end = struct
  type color = Red | Black

  type 'a tree =
    | Empty
    | Node of { color : color; value : 'a; left : 'a tree; right : 'a tree }

  let empty = Empty

  (* A properties of red-black trees:
     1. Node color: either red or black.
     2. Root property: root is always black.
     3. Red property: red node cannot have red children
     4. Black property: every path from a node to its descendant null node (leaves)
     has the same number of black nodes.
     5. Leaf property: all leaves (nil nodes) are black.

     Compare with AVL tree: the AVL tree is more balance but when it involves
     more insertions and deletions more rotation requires. So if the application
     requires more insertion and deletions the red-black tree is more suitable than the
     AVL tree.

     Search, insearch, delete: O(log n)
  *)

  (* Insertion steps:
     - BST insert: insert the new node like a standard BST.
     - Fix violations:
     - If the parent of the new node is black, no properties are violated.
     - If the parent is red, the tree might violate the red property, requiring fixes.

       Fix:
       After inserting the new node as a red node, there are several cases depending on the
       colors of node's parent and uncle (the sibling of the parent):
     - case 1:
            Uncle is red:
              + Recolor the parent and the uncle to black,
              + and the grandparent to red.
              + Then move up the grandparent and repeat if needed.
     - Case 2:
            Uncle is black:
     - 2.1: node is right child:
                + perform left rotation on the parent.
     - 2.2: node is left child:
                + perform right rotation on the grandparent
         and recolor appropriately
  *)

  let balance =
    (* Case 1: left child of the left subtree is red
              z (black)     =>        (red) y
              / \                       / \
        (red)y   d               (black)x  (black)z
            / \                        /\      /\
       (red)x  c                     a   b    c d
           /\
         a   b
    *)
    function
    | ( Black,
        z_value,
        Node
          {
            color = Red;
            value = y_value;
            left = Node { color = Red; value = x_value; left = a; right = b };
            right = c;
          },
        d )
    (* Case 2: right child of the left subtree is red
                   (black) z
                         /  \
                  (red) x    d
                       / \
                      a   y(red)
                          /\
                         b  c
    *)
    | ( Black,
        z_value,
        Node
          {
            color = Red;
            value = x_value;
            left = a;
            right = Node { color = Red; value = y_value; left = b; right = c };
          },
        d )
    (* Case 3: left child of right subtree is red
           (black) x
                  / \
                a    z (red)
                     / \
               (red)y   d
                   /\
                  b  c
    *)
    | ( Black,
        x_value,
        a,
        Node
          {
            color = Red;
            value = z_value;
            left = Node { color = Red; value = y_value; left = b; right = c };
            right = d;
          } )
    (* Case 4: right child of the right subtree is red
            (black) x
                   / \
                  a   z(red)
                      /\
                     b  y(red)
                        /\
                        c d
    *)
    | ( Black,
        x_value,
        a,
        Node
          {
            color = Red;
            value = z_value;
            left = b;
            right = Node { color = Red; value = y_value; left = c; right = d };
          } ) ->
        (* Rotate and recolor
                   (red) y_value
                     /      \
           (black)x_value  z_value (black)
                   / \       /\
                  a   b     c  d
        *)
        Node
          {
            color = Red;
            value = y_value;
            left = Node { color = Black; value = x_value; left = a; right = b };
            right = Node { color = Black; value = z_value; left = c; right = d };
          }
    (* Default case: no violation, return the tree as it is *)
    | color, value, left, right -> Node { color; value; left; right }

  let insert x t =
    let rec ins = function
      | Empty -> Node { color = Red; value = x; left = Empty; right = Empty }
      | Node { color; value; left; right } as s ->
          if x < value then balance (color, value, ins left, right)
          else if x > value then balance (color, value, left, ins right)
          else s
    in
    (* ensure the root is black after insertion *)
    match ins t with
    | Node { value; left; right; _ } ->
        Node { color = Black; value; left; right }
    | Empty -> failwith "insert: unreachable"

  let search tree target =
    let rec search_aux tree target =
      match tree with
      | Empty -> false
      | Node { value; left; right; _ } ->
          if target = value then true
          else if target < value then search_aux left target
          else search_aux right target
    in
    search_aux tree target
end
