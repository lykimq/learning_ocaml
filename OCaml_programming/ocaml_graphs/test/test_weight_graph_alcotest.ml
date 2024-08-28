open Ocaml_graphs
open Weight_graph
open Alcotest

let test_add_and_take () =
  let open PriorityQueue in
  let pq = create () in
  add pq (5, 10);
  add pq (2, 20);
  add pq (8, 30);

  let p1, v1 = take pq in
  check int "First priority should be 2" 2 p1;
  check int "First value should be B" 20 v1;

  let p2, v2 = take pq in
  check int "Second priority should be 5" 5 p2;
  check int "Second priority shoud be 30" 10 v2;

  let p3, v3 = take pq in
  check int "Third priority should be 8" 8 p3;
  check int "Third priority shoudl be 30" 30 v3

let test_is_empty () =
  let open PriorityQueue in
  let pq = create () in
  check bool "Init empty" true (is_empty pq);

  add pq (1, 100);
  check bool "It is not empty" false (is_empty pq);

  let _ = take pq in
  check bool "Empty after removing the only element" true (is_empty pq)

let setup_graph () =
  let open Weight_graph in
  let g = create 5 in
  (*
       0
   10 / \ 5
     1--4
   1 |  |
     2  |
     |  |
   4 \  / 3
      3
*)
  add_edge g { src = 0; dest = 1; weight = 10 } ~directed:false;
  add_edge g { src = 0; dest = 4; weight = 5 } ~directed:false;
  add_edge g { src = 1; dest = 2; weight = 1 } ~directed:false;
  add_edge g { src = 2; dest = 3; weight = 4 } ~directed:false;
  add_edge g { src = 3; dest = 4; weight = 3 } ~directed:false;
  add_edge g { src = 4; dest = 1; weight = 2 } ~directed:false;
  g

let test_dijkstra () =
  let open Weight_graph in
  let g = setup_graph () in
  let dist = dijkstra g 0 in
  check int "Distance to vertex 0 should be 0" 0 dist.(0);
  check int "Distance to vertex 1 should be 7" 7 dist.(1);
  check int "Distance to vertex 2 should be 8" 8 dist.(2);
  check int "Distance to vertex 3 should be 8" 8 dist.(3);
  check int "Distance to vertex 4 should be 5" 5 dist.(4)

let test_dijkstra_directed () =
  let open Weight_graph in
  let g = create 5 in
  add_edge g { src = 0; dest = 1; weight = 10 } ~directed:true;
  add_edge g { src = 0; dest = 2; weight = 5 } ~directed:true;
  add_edge g { src = 1; dest = 3; weight = 1 } ~directed:true;
  add_edge g { src = 2; dest = 1; weight = 3 } ~directed:true;
  add_edge g { src = 2; dest = 3; weight = 9 } ~directed:true;
  add_edge g { src = 3; dest = 4; weight = 4 } ~directed:true;
  let dist = dijkstra g 0 in
  check int "Distance to vertex 0 should be 0" 0 dist.(0);
  check int "Distance to vertex 1 should be 8" 8 dist.(1);
  check int "Distance to vertex 2 should be 5" 5 dist.(2);
  check int "Distance to vertex 3 should be 9" 9 dist.(3);
  check int "Distance to vertex 4 should be 13" 13 dist.(4)

let () =
  let open Alcotest in
  run "Priority Queue tests"
    [
      ( "PriorityQueue",
        [ test_case "Add and take elements" `Quick test_add_and_take ] );
      ("PriorityEmpty", [ test_case "Check empty" `Quick test_is_empty ]);
      ("Dijkstra", [ test_case "Check Dijkstra" `Quick test_dijkstra ]);
      ( "Dijkstra Directed Graph",
        [
          test_case "Check Dijkstra Directed graph" `Quick
            test_dijkstra_directed;
        ] );
    ]
