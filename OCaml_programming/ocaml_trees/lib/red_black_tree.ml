module Red_Black_Tree : sig
  type color = Red | Black

  type 'a tree =
    | Empty
    | Node of { color : color; value : 'a; left : 'a tree; right : 'a tree }

  val empty : 'a tree
  val print_tree : Format.formatter -> int tree -> unit
  val insert : 'a -> 'a tree -> 'a tree
  val search : 'a tree -> 'a -> bool
  val delete : cmp:('a -> 'b -> int) -> 'a -> 'b tree -> 'b tree
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

  let redden = function
    | Empty -> failwith "Can't redden leaf"
    | Node { color = _; value; left; right } ->
        Node { color = Red; value; left; right }

  let balance_left color (left, is_shorter) value right =
    if is_shorter then
      match (color, left, value, right) with
      (* Case where:
         - The parent is black.
         - Right subtree:
            + The right child is red and has black left child.
           Fix: rotate left, and adjust color to balance the tree.
                (Black)x          =>          y(Black)
                  /  \                           /\
                 a   z(Red)                   x(B) z(B)
                      /  \                     /\   /\
                  (B)y     d                  a b   c d(R)
                     /\
                    b  c
      *)
      | ( Black,
          a,
          x,
          Node
            {
              color = Red;
              value = z;
              left = Node { color = Red; value = y; left = b; right = c };
              right = d;
            } ) ->
          ( Node
              {
                color = Black;
                value = y;
                left = Node { color = Black; value = x; left = a; right = b };
                right = balance (Black, z, c, redden d);
              },
            false )
      (* Case where:
         - Parent is black.
         - Right child is black has a red child
           right-left:
                     (Black) x
                        /   \
                       a    z(Black)
                             /   \
                         (R)y     d
                         /  \
                        b   c
           right-right:
                                            ==>          y(Black)
               (Black) x                                  /    \
                   /     \                         (Black) x   z(Black)
                  a       y(Black)                     /  \     / \
                           / \                        a    b   c   d
                          b   z(R)
                               /\
                              c  d
      *)
      | ( k,
          a,
          x,
          Node
            {
              color = Black;
              value = z;
              left = Node { color = Red; value = y; left = b; right = c };
              right = d;
            } )
      | ( k,
          a,
          x,
          Node
            {
              color = Black;
              value = y;
              left = b;
              right = Node { color = Red; value = z; left = c; right = d };
            } ) ->
          ( Node
              {
                color = k;
                value = y;
                left = Node { color = Black; value = x; left = a; right = b };
                right = Node { color = Black; value = z; left = c; right = d };
              },
            false )
      (* Case where:
         - Parent is black,
         - Right child is black and has two black children
              (Black)x              =>      (Black) y
                 /  \                          /  \
                y   Black(z)                  x    z(Red)
                     /\                             / \
                    c  d                           c   d
           k = Black
      *)
      | k, x, y, Node { color = Black; value = z; left = c; right = d } ->
          ( Node
              {
                color = Black;
                value = y;
                left = x;
                right = Node { color = Red; value = z; left = c; right = d };
              },
            k = Black )
      | _ -> failwith "Unexpected tree structure during balancing"
    else (Node { color; value; left; right }, false)

  let balance_right color left value (right, is_shorter) =
    if is_shorter then
      match (color, left, value, right) with
      (* Case where:
         - Parent is Black
         - Left child is Red and its right child is Black
           Fix: rotate right and adjust the colors to balance the tree
               z(Black)       =>         y(Black)
                 /  \                      /    \
            (R)x      d                (Black)x  z(Black)
              / \                         /  \      /  \
             a  y(Black)               (R)a   b    c   d
                 / \
                b   c
      *)
      | ( Black,
          Node
            {
              color = Red;
              value = x;
              left = a;
              right = Node { color = Black; value = y; left = b; right = c };
            },
          z,
          d ) ->
          ( Node
              {
                color = Black;
                value = y;
                left =
                  Node
                    {
                      color = Black;
                      value = x;
                      left = balance (Black, x, redden a, b);
                      right = b;
                    };
                right = Node { color = Black; value = z; left = c; right = d };
              },
            false )
      (* Case where :
         - The parent is black
         - left child is Black, its left child is Red

         left-left:
                    (Black) z
                     /    \
              (Black)y     d
                  / \
            (Red) x  c
                / \
               a   b

          left-right:              ===>      (Black)y
                (Black)z                        /   \
                   /  \                   (Black)x   z(Black)
             (Black)x  d                       /\      / \
                 / \                          a  b     c d
                a   y(Red)
                    / \
                   b   c
      *)
      | ( k,
          Node
            {
              color = Black;
              value = y;
              left = Node { color = Red; value = x; left = a; right = b };
              right = c;
            },
          z,
          d )
      | ( k,
          Node
            {
              color = Black;
              value = x;
              left = a;
              right = Node { color = Red; value = y; left = b; right = c };
            },
          z,
          d ) ->
          ( Node
              {
                color = k;
                value = y;
                left = Node { color = Black; value = x; left = a; right = b };
                right = Node { color = Black; value = z; left = c; right = d };
              },
            false )
      (* Case where:
         - The parent is Black
         - Left child is black and its right child has two black children

                   (Black)y           =>      (Black)y
                   /       \                       /  \
                 (Black)x   z               (Red)x     z
                    / \                          /\
                   a   b                       a   b

         k = Black
      *)
      | k, Node { color = Black; value = x; left = a; right = b }, y, z ->
          ( Node
              {
                color = Black;
                value = y;
                left = Node { color = Red; value = x; left = a; right = b };
                right = z;
              },
            k = Black )
      | _ -> failwith "Impossible cases"
    else (Node { color; value; left; right }, false)

  let rec max_node = function
    | Node { value; right = Empty; _ } -> value
    | Node { right; _ } -> max_node right
    | Empty -> failwith "Empty tree has no maximum value "

  let rec remove_max ~cmp = function
    | Node { color = _; value = _; left = _; right = Empty } as n ->
        remove_node ~cmp n
    | Node { color; value; left; right } ->
        let right', is_shorter = remove_max ~cmp right in
        balance_right color left value (right', is_shorter)
    | Empty -> failwith "Impossible"

  and remove_node ~cmp = function
    (* Case where the node to remove is a red leaf. Replace it with Empty *)
    | Node { color = Red; value = _; left = Empty; right = Empty } ->
        (Empty, false)
    (* Case where the node to remove is a black leaf. Remove requires to changing
       the color *)
    | Node { color = Black; value = _; left = Empty; right = Empty } ->
        (Empty, true)
    (* Case where the node to be remove is black and it has (left/right) red child.
       Recolor red child to black. *)
    | Node
        {
          color = Black;
          value = _;
          left = Node { color = Red; value = v; left = l; right = r };
          right = Empty;
        }
    | Node
        {
          color = Black;
          value = _;
          left = Empty;
          right = Node { color = Red; value = v; left = l; right = r };
        } ->
        (Node { color = Black; value = v; left = l; right = r }, false)
    (* General case where the node has two children. Find the maximum value in the left subtree, remove it
       and balance the tree *)
    | Node { color = c; value = _; left; right } ->
        let v = max_node left in
        let left', is_shorter = remove_max ~cmp left in
        balance_left c (left', is_shorter) v right
    | Empty -> failwith "Impossible"

  let delete ~cmp x tree =
    let rec del_aux = function
      | Empty -> raise Not_found
      | Node { color; value = y; left; right } as node ->
          let c = cmp x y in
          if c < 0 then balance_left color (del_aux left) y right
          else if c > 0 then balance_right color left y (del_aux right)
          else remove_node ~cmp node
    in
    fst @@ del_aux tree
end
