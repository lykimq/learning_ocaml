open Ocaml_graphs
open Graph

module DFS : sig
  val dfs : Graph.t -> int -> unit
end = struct
  let dfs g start =
    (* initialized the visited array *)
    let visited = Array.make (List.length (Graph.vertices g)) false in
    ()
end
