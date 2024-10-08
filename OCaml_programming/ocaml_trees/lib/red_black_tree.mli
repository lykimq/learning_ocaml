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
end
