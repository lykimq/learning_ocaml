module Graph : sig
  type t

  (* The type representing an edge is a pair of vertices *)
  type edge = int * int

  (* Create a graph with [num_vertices] vertices and no edges *)
  val create : int -> t

  (* Adds an undirected edge between vertices [u] and [v] in graph [g] *)
  val add_edge : t -> edge -> unit

  (* Returns the list of vertices adjacent to vertex [v] *)
  val neighbors : t -> int -> int list

  (* Returns a list of all vertices in the graph *)
  val vertices : t -> int list
  val dfs : t -> int -> Format.formatter -> unit
end
