module Red_Black_Tree : sig
  type color = Red | Black

  type 'a tree =
    | Empty
    | Node of { color : color; value : 'a; left : 'a tree; right : 'a tree }

  val empty : 'a tree
  val insert : 'a -> 'a tree -> 'a tree
  val search : 'a tree -> 'a -> bool
  val left_rotate : 'a tree -> 'a tree
  val right_rotate : 'a tree -> 'a tree
  val delete : 'a tree -> 'a -> 'a tree
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

  (*
        x            =>          y
      /   \                   /     \
     l     y                 x(b)  y_right
         /   \                / \
    y_left y_right           l  y_left
  *)
  let left_rotate = function
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
  let right_rotate = function
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

  let balance = function
    (* Case 1: Left-left: left child and grandchild are red
           z(black)                 =>      y(red)
             /   \                           /    \
        (red)y     d                   (black)x    z(black)
          /   \                           /\         /\
       (red)x  c                         a  b       c  d
         / \
        a   b
    *)
    | Node
        {
          color = Black;
          value = z;
          left =
            Node
              {
                color = Red;
                value = y;
                left = Node { color = Red; value = x; left = a; right = b };
                right = c;
              };
          right = d;
        } ->
        Node
          {
            color = Red;
            value = y;
            left = Node { color = Black; value = x; left = a; right = b };
            right = Node { color = Black; value = z; left = c; right = d };
          }
    (* Case 2: Right-Right: right child and right grandchild are red
        z(black)       =>          y(red)
         /\                         /\
        d  y(red)               (b)z  x(b)
            / \                  /\    /\
           a   x(red)           d  a  b  c
                /\
               b  c
    *)
    | Node
        {
          color = Black;
          value = z;
          left = d;
          right =
            Node
              {
                color = Red;
                value = y;
                left = a;
                right = Node { color = Red; value = x; left = b; right = c };
              };
        } ->
        Node
          {
            color = Red;
            value = y;
            left = Node { color = Black; value = z; left = d; right = a };
            right = Node { color = Black; value = x; left = b; right = c };
          }
    (* Case 3: Left-right (left child is red and right grandchild is red)
              z(black)              =>  y(red)
              /       \                   /\
            (red)x    d               (b)x  z(black)
             / \                        /\    /\
            a  y(red)                  a  b   c d
                /\
               b  c
    *)
    | Node
        {
          color = Black;
          value = z;
          left =
            Node
              {
                color = Red;
                value = x;
                left = a;
                right = Node { color = Red; value = y; left = b; right = c };
              };
          right = d;
        } ->
        Node
          {
            color = Red;
            value = y;
            left = Node { color = Black; value = x; left = a; right = b };
            right = Node { color = Black; value = z; left = c; right = d };
          }
    (* Case 4: Right-left (right child is red and left grandchild is red )
                  z(black)      =>           y(red)
                  /   \                      /   \
                 d    x(red)               (b)z  x(black)
                       /  \                 /\     /\
                  (red)y   c               d  a   b  c
                    /\
                   a  b
    *)
    | Node
        {
          color = Black;
          value = z;
          left = d;
          right =
            Node
              {
                color = Red;
                value = x;
                left = Node { color = Red; value = y; left = a; right = b };
                right = c;
              };
        } ->
        Node
          {
            color = Red;
            value = y;
            left = Node { color = Black; value = z; left = d; right = a };
            right = Node { color = Black; value = x; left = b; right = c };
          }
    | t -> t

  let insert x t =
    let rec ins = function
      | Empty -> Node { color = Red; value = x; left = Empty; right = Empty }
      | Node { color; value; left; right } as t ->
          if x < value then
            balance (Node { color; value; left = ins left; right })
          else if x > value then
            balance (Node { color; value; left; right = ins right })
          else t
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

  (* Deletion:
     - Find the minimum value node in a subtree
     - Rotation: left; right
     - Fix double black issues
     - Delete
  *)

  let adjust_tree tree =
    match tree with
    | Empty -> Empty
    | Node { color = c; value = v; left = l; right = r } -> (
        (* Case 1: if left child is red and right is empty; perform rotation *)
        let new_left, new_tree =
          match l with
          | Node { color = Red; right = Empty; _ } -> (
              let rotated =
                left_rotate (Node { color = c; value = v; left = l; right = r })
              in
              match rotated with
              | Node { color = _; value = _; left; right = r } ->
                  (left, Node { color = c; value = v; left; right = r })
              | Empty -> failwith "Unexpected tree structure")
          | _ -> (l, Node { color = c; value = v; left = l; right = r })
        in
        match new_left with
        | Node { color = Red; right = Node { color = Red; _ }; _ } ->
            right_rotate new_tree
        | _ -> new_tree |> balance)

  let rec fix_double_black ~tree ~parent_color ~parent_value ~sibling_color
      ~sibling_value ~sibling_left ~sibling_right ~side =
    match sibling_color with
    (* Case 1: sibling is red *)
    | Red ->
        (* Rotate and swap colors
             parent          =>    sibling
              /   \                  /\
           double  sibling      sibling double
                     /\          /\
                    L  R         L R
        *)
        let new_parent =
          Node
            {
              color = Red;
              value = parent_value;
              left = tree;
              right =
                Node
                  {
                    color = Black;
                    value = sibling_value;
                    left = sibling_left;
                    right = sibling_right;
                  };
            }
        in
        let new_tree =
          if side = `Left then right_rotate new_parent
          else left_rotate new_parent
        in
        fix_double_black ~tree:(balance new_tree) ~parent_color:Red
          ~parent_value ~sibling_color:Black ~sibling_value ~sibling_left
          ~sibling_right ~side
    (* Case 2: sibling is black *)
    | Black ->
        let has_red_child =
          match (sibling_left, sibling_right) with
          | Node { color = Red; _ }, _ | _, Node { color = Red; _ } -> true
          | _ -> false
        in
        if has_red_child then
          (* Sibling has at least one red child *)
          let new_tree = adjust_tree tree in
          fix_double_black ~tree:(balance new_tree) ~parent_color ~parent_value
            ~sibling_color:Black ~sibling_value ~sibling_left ~sibling_right
            ~side
        else
          (* Case 3: sibling and its children are black
                parent
                / \
             double
             /
             sibling (black)
          *)
          let new_tree =
            if side = `Left then
              Node
                {
                  color = parent_color;
                  value = parent_value;
                  left =
                    Node
                      {
                        color = Black;
                        value = sibling_value;
                        left = sibling_left;
                        right = sibling_right;
                      };
                  right = tree;
                }
            else
              Node
                {
                  color = parent_color;
                  value = parent_value;
                  left = tree;
                  right =
                    Node
                      {
                        color = Black;
                        value = sibling_value;
                        left = sibling_left;
                        right = sibling_right;
                      };
                }
          in
          fix_double_black ~tree:(balance new_tree) ~parent_color:Black
            ~parent_value ~sibling_color:Red ~sibling_value ~sibling_left
            ~sibling_right ~side

  (* Tail-recursive delete function *)
  let delete t value =
    let rec delete_aux t value =
      match t with
      | Empty -> Empty
      | Node { color; value = v; left; right } -> (
          if value < v then
            (* Delete on the left subtree *)
            let new_left = delete_aux left value in
            let new_tree = Node { color; value = v; left = new_left; right } in
            fix_double_black ~tree:new_tree ~parent_color:color ~parent_value:v
              ~sibling_color:Black ~sibling_value:v ~sibling_left:Empty
              ~sibling_right:Empty ~side:`Left
          else if value > v then
            (* Delete on the right subtree *)
            let new_right = delete_aux right value in
            let new_tree = Node { color; value = v; left; right = new_right } in
            fix_double_black ~tree:new_tree ~parent_color:color ~parent_value:v
              ~sibling_color:Black ~sibling_value:v ~sibling_left:Empty
              ~sibling_right:Empty ~side:`Right
          else
            (* Node to be deleted found *)
            match (left, right) with
            | Empty, _ -> right
            | _, Empty -> left
            | _ ->
                (* Node with two children: find the in-order successor *)
                let rec min_node t =
                  match t with
                  | Empty -> failwith "Tree cannot be empty"
                  | Node { left = Empty; _ } -> t
                  | Node { left; _ } -> min_node left
                in
                let successor = min_node right in
                let successor_value =
                  match successor with
                  | Node { value = sv; _ } -> sv
                  | _ -> failwith "Unexpected tree structure"
                in
                let new_right = delete_aux right successor_value in
                Node { color; value = successor_value; left; right = new_right }
          )
    in
    match delete_aux t value with
    | Node { value; left; right; _ } ->
        Node { color = Black; value; left; right }
    | Empty -> failwith "delete: unreachable"
end
