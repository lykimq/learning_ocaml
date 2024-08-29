module Patricia_Tree : sig
  type node = {
    prefix : string;
    children : (char * node) list;
    is_terminal : bool;
  }

  type t = node option

  val empty : t option
  val find : string -> node option -> bool
  val insert : string -> node option -> node option
  val delete : string -> node option -> node option
  val to_list : node option -> string list
end
