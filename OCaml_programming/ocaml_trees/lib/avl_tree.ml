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

  (* Rotate right function:

         original tree:

                Y
               / \
              X   C
             / \
             A   B

       Because the left is heavier than the right: so we perform the rotate to the
       right to balance it:

                X
               / \
              A   Y
                 / \
                 B   C

      - Check if we can rotate: make sure Y is not empty and has a left child X.
      - Adjust tree structure:
       - Move X up where Y was
       - Attach Y as the right child of X;
       - Make sure Y keeps its right child C
     - Update height: after moving things around, update the heights of X and Y.
  *)

  let height = function Empty -> 0 | Node { height; _ } -> height

  let update_height node =
    match node with
    | Empty -> Empty
    | Node { value; left; right; _ } ->
        let new_height = 1 + max (height left) (height right) in
        Node { value; left; right; height = new_height }

  let right_rotate y =
    match y with
    | Empty -> Empty
    | Node { left = Empty; _ } -> y (* No rotation if Y has no left child *)
    | Node
        {
          value = y_value;
          left = Node { value = x_value; left = x_left; right = x_right; _ };
          right = y_right;
          _;
        } ->
        (* Create new subtree with Y and its new right child
           y now becomes child of x,
           any right of x becomes left of y,
        *)
        let new_right =
          update_height
            (Node
               { value = y_value; left = x_right; right = y_right; height = 0 })
        in
        (* Return new subtree with X as the new root
            x becomes root,
            left of x is still left of x,
            right of x is the new right.
        *)
        update_height
          (Node
             { value = x_value; left = x_left; right = new_right; height = 0 })

  (* In left rotation, the structure is adjusted to maintain the AVL tree balance when
      a node's right child is too heavy.

        y                         x
        \                        / \
         x                      y   x_right
         /\                    /
     x_left  x_right          x_left
  *)
  let left_rotate y =
    match y with
    | Empty -> Empty
    | Node { right = Empty; _ } -> y
    | Node
        {
          value = y_value;
          right = Node { value = x_value; left = x_left; right = x_right; _ };
          left = y_left;
          _;
        } ->
        let new_left =
          update_height
            (Node { value = y_value; left = y_left; right = x_left; height = 0 })
        in
        update_height
          (Node
             { value = x_value; left = new_left; right = x_right; height = 0 })
end
