open Ocaml_trees.Avl_tree

module File_System_Avl_Tree_Balance : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node AVL_Tree.avl_tree }
  and node = File of file | Directory of directory

  val string_of_node : node -> string
  val compare_nodes : node -> node -> int
  val insert_node : node -> node -> node
  val print_node_avl_tree : node AVL_Tree.avl_tree -> string -> unit
  val add_file : node -> file -> node
  val print_filesystem : node -> string -> unit
  val find_directory : string list -> node -> node option
  val remove_node : node -> node -> node
end
