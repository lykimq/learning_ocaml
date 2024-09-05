module AVL_Tree : sig
  type 'a avl_tree =
    | Empty
    | Node of {
        value : 'a;
        left : 'a avl_tree;
        right : 'a avl_tree;
        height : int;
      }

  val empty : 'a avl_tree
  val height : 'a avl_tree -> int
  val print_tree : int avl_tree -> string
  val make_node : 'a -> 'a avl_tree -> 'a avl_tree -> 'a avl_tree
  val rotate_right : 'a avl_tree -> 'a avl_tree
  val rotate_left : 'a avl_tree -> 'a avl_tree
  val rotate_left_right : 'a avl_tree -> 'a avl_tree
  val rotate_right_left : 'a avl_tree -> 'a avl_tree
  val insert : cmp:('a -> 'a -> int) -> 'a -> 'a avl_tree -> 'a avl_tree
  val delete : cmp:('a -> 'a -> int) -> 'a -> 'a avl_tree -> 'a avl_tree
  val search : cmp:('a -> 'a -> int) -> 'a -> 'a avl_tree -> bool
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
  let height = function Empty -> 0 | Node { height; _ } -> height

  let print_tree tree =
    let rec aux stack acc =
      match stack with
      | [] -> acc
      | Empty :: rest -> aux rest (acc ^ "Empty ")
      | Node { value; left; right; height } :: rest ->
          let node_str = Printf.sprintf "Node (%d, %d) " value height in
          aux (left :: right :: rest) (acc ^ node_str)
    in
    aux [ tree ] ""

  let balance_factor = function
    | Empty -> 0
    | Node { left; right; _ } -> height left - height right

  let make_node value left right =
    let height = 1 + max (height left) (height right) in
    Node { value; left; right; height }

  let rotate_left = function
    | Node
        {
          value = x_value;
          left = x_left;
          right = Node { value = y_value; left = y_left; right = y_right; _ };
          _;
        } ->
        (* rotate left when the right is heavy,
                        x
                       / \
                  x_left  y
                          /\
                       y_left y_right
           =>
                      y
                     /\
                    x  y_right
                   / \
             x_left  y_left
        *)
        make_node y_value (make_node x_value x_left y_left) y_right
    | t -> t

  let rotate_right = function
    | Node
        {
          value = x_value;
          left = Node { value = y_value; left = y_left; right = y_right; _ };
          right = x_right;
          _;
        } ->
        (* rotate right when left is heavy,
                    x
                   / \
                  y   x_right
                 / \
             y_left y_right
           =>
                       y
                      / \
                 y_left  x
                         /\
                    y_right x_right
        *)
        make_node y_value y_left (make_node x_value y_right x_right)
    | t -> t

  (* left-right rotation
     - left rotation on the left child
     - right rotation on the node
  *)

  let rotate_left_right = function
    | Node { value = x_value; left = x_left; right = x_right; _ } ->
        let new_left = rotate_left x_left in
        rotate_right (make_node x_value new_left x_right)
    | t -> t

  (* right-left rotation
     - right rotation on the right child
     - left rotation on the node
  *)

  let rotate_right_left = function
    | Node { value = x_value; left = x_left; right = x_right; _ } ->
        let new_right = rotate_right x_right in
        rotate_left (make_node x_value x_left new_right)
    | t -> t

  let rebalance node =
    let bf = balance_factor node in
    (*
        1: left-heavy:
            - left >= 0: rotate right
            - left child < 0: rotate_left_right node
       -1: right heavy:
            - right child <= 0: rotate left
            - right child > 0: rotate_right_left node
        0: node
    *)
    if bf > 1 then
      match node with
      | Node { left = Node { left = _; right = _; _ } as left_child; _ }
        when balance_factor left_child >= 0 ->
          (* left-left *)
          rotate_right node
      | Node { left = Node { left = _; right = _; _ }; _ } ->
          (* bf < 0 *)
          rotate_left_right node
      | _ -> node
    else if bf < -1 then
      match node with
      | Node { right = Node { left = _; right = _; _ } as right_child; _ }
        when balance_factor right_child <= 0 ->
          (* right - right *)
          rotate_left node
      | Node { right = Node { left = _; right = _; _ }; _ } ->
          (* bf > 0 *)
          rotate_right_left node
      | _ -> node
    else node

  let rec insert ~cmp x = function
    | Empty -> make_node x Empty Empty
    | Node { value; left; right; _ } as node ->
        if cmp x value < 0 then
          rebalance (make_node value (insert ~cmp x left) right)
        else if cmp x value > 0 then
          rebalance (make_node value left (insert ~cmp x right))
        else node

  let find_min tree =
    let rec aux current_min = function
      | Empty -> current_min
      | Node { value; left = Empty; _ } -> value
      | Node { left; _ } -> aux current_min left
    in
    match tree with
    | Empty -> failwith "Tree is empty"
    | Node { value; _ } -> aux value tree

  let rec delete_min = function
    | Empty -> failwith "Tree is empty"
    | Node { left = Empty; right; _ } -> right
    | Node { value; left; right; _ } ->
        rebalance (make_node value (delete_min left) right)

  let rec delete ~cmp x = function
    (*
             50
            /  \
           30   70
          / \   / \
        20  40  60 80
        => delete 50

        50 has (30; 70) -> search for the smallest value in the right subtree ->
          70 is root of the right subtree, the smallest value is 60.
          -> swap the 50 and 60, remove 50

           60
          / \
        30   70
        /\    \
      20  40   80
   *)
    | Empty -> Empty
    | Node { value; left; right; _ } -> (
        if cmp x value < 0 then
          rebalance (make_node value (delete ~cmp x left) right)
        else if cmp x value > 0 then
          rebalance (make_node value left (delete ~cmp x right))
        else
          (* if it match the current node *)
          match right with
          | Empty -> left
          | _ ->
              (* find the minimum value from the right subtree
                 replaces the current node with it, delete the minimum and rebalances *)
              let min = find_min right in
              rebalance (make_node min left (delete_min right)))

  let search ~cmp x tree =
    let rec aux = function
      | Empty -> false
      | Node { value; left; right; _ } ->
          if cmp x value = 0 then true
          else if cmp x value < 0 then aux left
          else aux right
    in
    aux tree
end
