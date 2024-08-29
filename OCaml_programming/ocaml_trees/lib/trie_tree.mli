module Trie_Tree : sig
  type t = { children : (char, t) Hashtbl.t; mutable is_end_of_word : bool }

  val create_node : unit -> t
  val insert : t -> string -> unit
  val search : t -> string -> bool
  val all_words : t -> string list
  val words_with_prefix : t -> string -> string list
  val count_words_with_prefix : t -> string -> int
  val delete : t -> string -> unit
end
