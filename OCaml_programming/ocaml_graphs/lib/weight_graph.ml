module PriorityQueue : sig
  type t

  val create : unit -> t
  val add : t -> int * int -> unit
  val take : t -> int * int
  val is_empty : t -> bool
end = struct
  type t = (int * int) list ref

  let create () = ref []

  let add pq (priority, value) =
    let rec insert = function
      | [] -> [ (priority, value) ]
      | (p, v) :: rest as l ->
          if priority < p then (priority, value) :: l else (p, v) :: insert rest
    in
    pq := insert !pq

  let take pq =
    match !pq with
    | [] -> failwith "PriorityQueue is empty"
    | (p, v) :: rest ->
        (* Update ref pq to point to the new list *)
        pq := rest;
        (* This is the element with the highest priority;
           return the removed from the priority queue *)
        (p, v)

  let is_empty pq = !pq = []
end

module Weight_graph : sig
  type edge = { src : int; dest : int; weight : int }
  type t = { num_vertices : int; edges : edge list array }

  val create : int -> t
  val add_edge : t -> edge -> directed:bool -> unit
  val neighbors : t -> int -> (int * int) list
  val vertices : t -> int list
  val dijkstra : t -> int -> int array
end = struct
  type edge = { src : int; dest : int; weight : int }
  type t = { num_vertices : int; edges : edge list array }

  (* Create a graph with a given number of vertices *)
  let create num_vertices = { num_vertices; edges = Array.make num_vertices [] }

  (* Add an edge to the graph *)
  let add_edge g { src; dest; weight } ~directed =
    if src < g.num_vertices && dest < g.num_vertices then (
      g.edges.(src) <- { src; dest; weight } :: g.edges.(src);
      if not directed then
        g.edges.(dest) <- { src = dest; dest = src; weight } :: g.edges.(dest))
    else failwith "Vertex out of bounds"

  (* Get all neighbor of a given vertex, returns a list of
     (neighbor, weight) pair *)
  let neighbors g v =
    if v < g.num_vertices then
      List.map (fun edge -> (edge.dest, edge.weight)) g.edges.(v)
    else failwith "Vertex out of bounds"

  (* Get a list of all vertices in the graph *)
  let vertices g = List.init g.num_vertices (fun x -> x)

  (* Function to initialize distance and priority queue *)
  let init_dijkstra g start =
    (* initialize the distance array with infinity, except for the start vertex *)
    let dist = Array.make g.num_vertices max_int in
    dist.(start) <- 0;
    let prio_queue = PriorityQueue.create () in
    PriorityQueue.add prio_queue (0, start);
    (dist, prio_queue)

  (* Process a single vertex and update distances *)
  let process_vertex g dist prio_queue u =
    (* Iterate over all neighbors of vertex u *)
    List.iter
      (fun (v, weight) ->
        (* Calculate new distance to vertex v through u *)
        let new_dist = dist.(u) + weight in
        (* Update the distance if a shorter path is found *)
        if new_dist < dist.(v) then (
          dist.(v) <- new_dist;
          PriorityQueue.add prio_queue (new_dist, v)))
      (neighbors g u)

  let dijkstra g start =
    let dist, prio_queue = init_dijkstra g start in

    let rec process_queue prio_queue =
      if not (PriorityQueue.is_empty prio_queue) then
        let current_dist, u = PriorityQueue.take prio_queue in
        if current_dist <= dist.(u) then (
          process_vertex g dist prio_queue u;
          process_queue prio_queue)
    in
    process_queue prio_queue;
    (* Return the final array *)
    dist
end
