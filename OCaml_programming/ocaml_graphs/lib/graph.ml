module Graph : sig
  type t = { num_vertices : int; edges : int list array }
  type edge = int * int

  val create : int -> t
  val add_edge : t -> edge -> unit
  val neighbors : t -> int -> int list
  val vertices : t -> int list
  val dfs : t -> int -> Format.formatter -> unit
end = struct
  type t = { num_vertices : int; edges : int list array }
  type edge = int * int

  let create num_vertices = { num_vertices; edges = Array.make num_vertices [] }

  let add_edge g (u, v) =
    if u < g.num_vertices && v < g.num_vertices then (
      g.edges.(u) <- v :: g.edges.(u);
      g.edges.(v) <- u :: g.edges.(v))
    else failwith "Vertex out of bounds"

  let neighbors g v =
    if v < g.num_vertices then List.rev g.edges.(v)
      (* Reverse the list to get the order of addition *)
    else failwith "Vertex out of bounds "

  let vertices g = List.init g.num_vertices (fun x -> x)

  let dfs g start fmt =
    (* Initialized the visited array *)
    let visited = Array.make (List.length (vertices g)) false in
    (* Initialized the stack with the starting vertex *)
    let stack = Stack.create () in
    Stack.push start stack;

    (* Flag to track if it's the first vertex to print *)
    let is_first_vertex = ref true in

    (* Iteratively process the stack *)
    let rec dfs_iter () =
      if not (Stack.is_empty stack) then
        (* Pop the vertex from the stack *)
        let v = Stack.pop stack in
        if not visited.(v) then (
          (* Mark the vertex as visited *)
          visited.(v) <- true;
          (* Print the current vertex *)
          if !is_first_vertex then (
            Format.fprintf fmt "%d" v;
            is_first_vertex := false)
          else Format.fprintf fmt " %d" v;
          (* Push all unvisited neighbors onto the stack *)
          List.iter
            (fun neighbor ->
              if not visited.(neighbor) then Stack.push neighbor stack)
            (neighbors g v);
          (* Continue processing the stack*)
          dfs_iter ())
    in
    (* Start the DFS traversal *)
    dfs_iter ();
    (* The output is flushed after all vertices are printed *)
    Format.fprintf fmt "@."
end
