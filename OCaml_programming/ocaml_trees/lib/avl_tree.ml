module AVL_Tree : sig
  type 'a avl_tree

  val empty : 'a avl_tree

  val build_node :
    value:'a ->
    left:'a avl_tree ->
    right:'a avl_tree ->
    height:int ->
    'a avl_tree

  val print_tree : int avl_tree -> string
  val right_rotate : 'a avl_tree -> 'a avl_tree
  val left_rotate : 'a avl_tree -> 'a avl_tree
  val left_right_rotate : 'a avl_tree -> 'a avl_tree
  val right_left_rotate : 'a avl_tree -> 'a avl_tree
end = struct
  type 'a avl_tree =
    | Empty
    | Node of {
        value : 'a;
        left : 'a avl_tree;
        right : 'a avl_tree;
        height : int;
      }

  let empty = Empty

  let build_node ~value ~left ~right ~height =
    Node { value; left; right; height }

  let rec print_tree = function
    | Empty -> "Empty"
    | Node { value; left; right; height } ->
        Printf.sprintf "Node(%d, %s, %s, %d)" value (print_tree left)
          (print_tree right) height

  let height = function Empty -> 0 | Node { height; _ } -> height

  let update_height node =
    match node with
    | Empty -> Empty
    | Node { value; left; right; _ } ->
        let new_height = 1 + max (height left) (height right) in
        Node { value; left; right; height = new_height }

  let right_rotate a =
    match a with
    | Empty -> Empty
    | Node { left = Empty; _ } -> a (* No rotation if Y has no left child *)
    | Node
        {
          value = a_value;
          left = Node { value = b_value; left = b_left; right = b_right; _ };
          right = a_right;
          _;
        } ->
        (* Right rotation:
                a                   b
               /                    \
               b                     a
                \                    /
                 c                  c
           Before the rotation:
           - A is the current root node.
           - B is the left child of A.
           - C is the right child of B.

           After the rotation:
           - B becomes the root node.
           - A becomes the right child of B.
           - any right subtree of B, becomes left child of A.
        *)
        let new_right =
          update_height
            (Node
               { value = a_value; left = b_right; right = a_right; height = 0 })
        in
        update_height
          (Node
             { value = b_value; left = b_left; right = new_right; height = 0 })

  (* In left rotation, the structure is adjusted to maintain the AVL tree balance when
      a node's right child is too heavy.

        A                         B
        \                        /
         B                      A
         /\                      \
     B_left                      B_left

     Before the rotation:
     - Node A is the current root node.
     - Node B is the right child of A.

     After the rotation:
     - B becomes the root node.
     - A becomes the left child of B.
     - Any left subtree become the right child of A.
  *)
  let left_rotate a =
    match a with
    | Empty -> Empty
    | Node { right = Empty; _ } -> a
    | Node
        {
          value = a_value;
          right = Node { value = b_value; left = b_left; right = b_right; _ };
          left = a_left;
          _;
        } ->
        let new_left =
          update_height
            (Node { value = a_value; left = a_left; right = b_left; height = 0 })
        in
        update_height
          (Node
             { value = b_value; left = new_left; right = b_right; height = 0 })

  (* left-right rotation (LR)
               A                =>       C
              /                         / \
             B                         B   A
              \                         \
              C                          D
              /
              D


      Before the rotation:
      - A is the current root node.
      - B is the left child of node A.
      - C is the right child of node B
      - D is the left child of C.

     Perform 2 steps:
     - A left rotation on the right child of node A.
     - A right rotation on the root node (A)

      After the rotation:
      - C becomes the new root.
      - B is the left child of C.
      - A is the right child of C.
      - Any left subtree of C (if it exists), becomes the right child of B.
  *)
  let left_right_rotate a =
    match a with
    | Empty -> a
    | Node { value = a_value; left = b_node; right = a_right; _ } ->
        (* right rotate at B *)
        let new_left = left_rotate b_node in
        right_rotate
          (update_height
             (Node
                {
                  value = a_value;
                  left = new_left;
                  right = a_right;
                  height = 0;
                }))

  (* Right-left rotation

         A         =>    C
         \              / \
          B            A   B
          /                /
          C                D
          \
           D

     Before the rotation:
     - A is the current root node.
     - B is the right child of A.
     - C is the left child of B.

     After the rotation:
     - C becomes the new root node.
     - A is the left child of C.
     - B is the right child of C.
     - Any right subtree of C, becomes left child of B
  *)

  let right_left_rotate a =
    match a with
    | Empty -> Empty
    | Node { value = a_value; left = a_left; right = b_node; _ } ->
        (* left rotation on A *)
        let new_right = left_rotate b_node in
        right_rotate
          (update_height
             (Node
                {
                  value = a_value;
                  left = a_left;
                  right = new_right;
                  height = 0;
                }))
end
