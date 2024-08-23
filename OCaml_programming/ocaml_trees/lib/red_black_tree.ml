module Red_Black_Tree : sig
  type color = Red | Black

  type 'a tree =
    | Empty
    | Node of { color : color; value : 'a; left : 'a tree; right : 'a tree }

  val empty : 'a tree
  val print_tree : Format.formatter -> int tree -> unit
  val insert : 'a -> 'a tree -> 'a tree
  val search : 'a tree -> 'a -> bool

  (*val left_rotate : 'a tree -> 'a tree
    val right_rotate : 'a tree -> 'a tree
    val delete : 'a tree -> 'a -> 'a tree*)
end = struct
  type color = Red | Black

  type 'a tree =
    | Empty
    | Node of { color : color; value : 'a; left : 'a tree; right : 'a tree }

  let empty = Empty

  (* A properties of red-black trees:
     1. Node color: either red or black.
     2. Root and leaf(nil) property: root and leaf are always black.
     3. Red property: red node cannot have red children or
     if the node is red, then its children are black.
     4. Black property: every path from a node to its descendant null node (leaves)
     has the same number of black nodes.


     Compare with AVL tree: the AVL tree is more balance but when it involves
     more insertions and deletions more rotation requires. So if the application
     requires more insertion and deletions the red-black tree is more suitable than the
     AVL tree.

     Search, insearch, delete: O(log n)
  *)

  (*
        x            =>          y
      /   \                   /     \
     l     y                 x(b)  y_right
         /   \                / \
    y_left y_right           l  y_left
  *)
  let _left_rotate = function
    | Node
        {
          color = color_x;
          value = x;
          left;
          right =
            Node { color = color_y; value = y; left = y_left; right = y_right };
        } ->
        Node
          {
            color = color_y;
            value = y;
            left = Node { color = color_x; value = x; left; right = y_left };
            right = y_right;
          }
    | t -> t

  (*
         y                    =>        x
        / \                            /  \
       x   right                   xleft   y (black)
      /  \                                   /     \
     xleft xright                           xright right
  *)
  let _right_rotate = function
    | Node
        {
          color = color_y;
          value = y;
          left =
            Node { color = color_x; value = x; left = x_left; right = x_right };
          right;
        } ->
        Node
          {
            color = color_x;
            value = x;
            left = x_left;
            right = Node { color = color_y; value = y; left = x_right; right };
          }
    | t -> t

  let rec print_tree fmt tree =
    let open Format in
    match tree with
    | Empty -> fprintf fmt "Empty"
    | Node { color; value; left; right } ->
        fprintf fmt "Node {color = %s; value = %d; left = %a; right = %a}"
          (match color with Red -> "Red" | Black -> "Black")
          value print_tree left print_tree right

  let balance = function
    (* Case 1: left-left
            (black)z        =>  (red) y
                 / \                 / \
          (red)y   d           (black)x  z(black)
              / \                   /\    /\
        (red)x   c                 a  b   c d
            / \
            a b
    *)
    | ( Black,
        z,
        Node
          {
            color = Red;
            value = y;
            left = Node { color = Red; value = x; left = a; right = b };
            right = c;
          },
        d )
    (* Case 2: left-right
              (black)z      =>      (red)y
                /  \                  /  \
          (red)x    d           (black)x z(black)
              / \                  /\      / \
             a   y(red)           a  b     c d
                 /\
                b  c
    *)
    | ( Black,
        z,
        Node
          {
            color = Red;
            value = x;
            left = a;
            right = Node { color = Red; value = y; left = b; right = c };
          },
        d )
    (* Case 3: right-left
          (black)x       =>              y(red)
           /   \                          / \
          a    z(red)             (black)x   z(black)
               / \                  / \         /\
          (red)y  d                a   b       c  d
             /\
            b  c
    *)
    | ( Black,
        x,
        a,
        Node
          {
            color = Red;
            value = z;
            left = Node { color = Red; value = y; left = b; right = c };
            right = d;
          } )
    (* Case 4: right-right
          (black)x                =>    (red)y
           / \                            /   \
          a   y(red)               (black)x   z(black)
              / \                      /\       / \
              b  z(red)               a  b      c d
                 / \
                 c  d
    *)
    | ( Black,
        x,
        a,
        Node
          {
            color = Red;
            value = y;
            left = b;
            right = Node { color = Red; value = z; left = c; right = d };
          } ) ->
        Node
          {
            color = Red;
            value = y;
            left = Node { color = Black; value = x; left = a; right = b };
            right = Node { color = Black; value = z; left = c; right = d };
          }
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
    | Node { color = _; value; left; right } ->
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
