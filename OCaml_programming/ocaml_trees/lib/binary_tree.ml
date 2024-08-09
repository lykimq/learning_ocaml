module BinaryTree : sig
  type 'a tree

  val empty : 'a tree
  val insert : 'a -> 'a tree -> 'a tree
  val search : 'a -> 'a tree -> bool
  val inorder : 'a tree -> 'a list
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
end
