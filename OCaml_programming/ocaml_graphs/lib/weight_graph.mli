module PriorityQueue : sig
  type t

  val create : unit -> t
  val add : t -> int * int -> unit
  val take : t -> int * int
  val is_empty : t -> bool
end

module Weight_graph : sig
  type edge = { src : int; dest : int; weight : int }
  type t = { num_vertices : int; edges : edge list array }

  val create : int -> t
  val add_edge : t -> edge -> directed:bool -> unit
  val neighbors : t -> int -> (int * int) list
  val vertices : t -> int list
  val dijkstra : t -> int -> int array * bool array
end
