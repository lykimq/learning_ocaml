module Binary_Tree : sig
  type 'a tree

  val empty : 'a tree
  val insert : 'a -> 'a tree -> 'a tree
  val search : 'a -> 'a tree -> bool
  val inorder : 'a tree -> 'a list
  val preorder : 'a tree -> 'a list
  val postorder : 'a tree -> 'a list
  val print_tree : int tree -> unit
end = struct
  type 'a tree = Empty | Node of 'a * 'a tree * 'a tree

  let empty = Empty

  let insert x tree =
    let rec aux = function
      | Empty -> Node (x, Empty, Empty)
      | Node (v, left, right) as node ->
          if x < v then
            let new_left = aux left in
            Node (v, new_left, right)
          else if x > v then
            let new_right = aux right in
            Node (v, left, new_right)
          else node (* value already exists *)
    in
    aux tree

  let search x tree =
    let rec aux = function
      | Empty -> false
      | Node (v, left, right) ->
          if x = v then true else if x < v then aux left else aux right
    in
    aux tree

  let inorder tree =
    let rec aux acc = function
      | Empty -> acc
      | Node (v, left, right) ->
          (* order: left, root, right *)
          let acc_left = aux acc left in
          let acc_root = v :: acc_left in
          aux acc_root right
    in
    (* inorder:
       The result list of aux is constructed in reverse
       order due to how it constructs the list in ocaml.
       During the traversal, elements are added to the front
       of the list, which reverses the order in which they are collected.
    *)
    List.rev (aux [] tree)

  let preorder tree =
    let rec aux acc = function
      | Empty -> acc
      | Node (v, left, right) ->
          (* preorder: (root, left, right)*)
          let acc_root = v :: acc in
          let acc_left = aux acc_root left in
          aux acc_left right
    in
    List.rev (aux [] tree)

  let postorder tree =
    let rec aux acc = function
      | Empty -> acc
      | Node (v, left, right) ->
          (* postorder (left, right, root)*)
          let acc_left = aux acc left in
          let acc_right = aux acc_left right in
          v :: acc_right
    in
    List.rev (aux [] tree)

  let rec print_tree tree =
    match tree with
    | Empty -> print_string "Empty"
    | Node (v, left, right) ->
        print_string "Node (";
        print_string (string_of_int v);
        print_string ", ";
        print_tree left;
        print_string ", ";
        print_tree right;
        print_string ")"
end
