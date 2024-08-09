module Binary_Tree : sig
  type 'a tree

  val empty : 'a tree
  val insert : 'a -> 'a tree -> 'a tree
  val search : 'a -> 'a tree -> bool
  val inorder : 'a tree -> 'a list
  val print_tree : string tree -> unit
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
          (* order: right, root, left *)
          let acc = aux acc right in
          let acc = v :: acc in
          aux acc left
    in
    (* inorder: left, root, right *)
    List.rev (aux [] tree)

  let print_tree tree =
    let rec print_tree_aux tree indent is_right =
      match tree with
      | Empty -> ()
      | Node (v, left, right) ->
          let edge = if is_right then "|__" else "|--" in
          let new_indent =
            if is_right then indent ^ "   " else indent ^ "|   "
          in
          print_tree_aux right new_indent true;
          Printf.printf "%s%s%s\n" indent edge v;
          print_tree_aux left indent false
    in
    print_tree_aux tree "" false
end
