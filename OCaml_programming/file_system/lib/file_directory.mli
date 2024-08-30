module File_Directory : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node list }
  and node = File of file | Directory of directory

  val add_file : node -> file -> node
  val print_filesystem : node -> string -> unit
  val find_directory : string list -> node -> node option
  val remove_node : string -> node -> node
end
