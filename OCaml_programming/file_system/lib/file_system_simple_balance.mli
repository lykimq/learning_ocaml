(** Simpler Threshold-Based Balancing:
- Use case: If the file system is relatively small, or modifications are
  infrequent, the simpler approach may be sufficient.
  It is easier to implememt and maintain and introduces less overhead.
  - Trade-Off: You accept potentially worse performance in certain cases
  (if the tree becomes unblanced) in exchange for simplicity and lower resource
  usage.
*)
module File_System_Simple_Balance : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node list }
  and node = File of file | Directory of directory

  val calculate_depth : node -> int
  val add_file_balanced : node -> file -> node
  val print_filesystem : node -> string -> unit
  val find_directory : string list -> node -> node option
  val remove_node : string -> node -> node
end
