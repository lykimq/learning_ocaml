open Ocaml_graphs

let () =
  let open Graph in
  (* Create a graph with 5 vertices *)
  let g = Graph.create 5 in
  (* Add edges to the graph
            0
           /\
          1  4
          \  /
           2
           |
           3
  *)
  Graph.add_edge g (0, 1);
  Graph.add_edge g (0, 4);
  Graph.add_edge g (1, 2);
  Graph.add_edge g (1, 3);
  Graph.add_edge g (2, 4);

  (* Print all vertices in the graph *)
  Printf.printf "Vertices in the graph: %s\n"
    (String.concat ", " (List.map string_of_int (Graph.vertices g)));

  (* Print neighbors of vertex 1 *)
  Printf.printf "Neighbors of vertex 1: %s\n"
    (String.concat ", " (List.map string_of_int (Graph.neighbors g 1)));

  (* Print neigbors of vertex 0 *)
  Printf.printf "Neighbors of vertex 1: %s\n"
    (String.concat ", " (List.map string_of_int (Graph.neighbors g 0)));

  (* Try adding an edge with invalid vertices *)
  try
    Printf.printf "Neighbors of vertex 5: %s\n"
      (String.concat ", " (List.map string_of_int (Graph.neighbors g 5)))
  with Failure msg -> Printf.printf "Error: %s\n" msg
