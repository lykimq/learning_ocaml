open Alcotest
open Ocaml_graphs
open Undirect_graph

let capture_output f =
  let buf = Buffer.create 256 in
  let fmt = Format.formatter_of_buffer buf in
  f fmt;
  Format.pp_print_flush fmt ();
  Buffer.contents buf

let test_dfs () =
  let open Undirect_graph in
  let g = create 5 in
  (* Add edges to the graph
           0
          /\
         1  4
         \  /
          2
          |
          3
  *)
  add_edge g (0, 1);
  add_edge g (0, 4);
  add_edge g (1, 2);
  add_edge g (1, 3);
  add_edge g (2, 4);

  (* Test DFS from vertex 0 *)
  let output0 = capture_output (fun fmt -> dfs g 0 fmt) in
  let expected = "0 4 2 1 3\n" in
  check string "DFS from 0" expected output0;

  (* Test DFS from vertex 2 *)
  let output2 = capture_output (fun fmt -> dfs g 2 fmt) in
  let expected2 = "2 4 0 1 3\n" in
  check string "DFS from 2" expected2 output2

let test_bfs () =
  let open Undirect_graph in
  let g = create 5 in
  (* Add edges to the graph
           0
          /\
         1  4
         \  /
          2
          |
          3
  *)
  add_edge g (0, 1);
  add_edge g (0, 4);
  add_edge g (1, 2);
  add_edge g (1, 3);
  add_edge g (2, 4);
  (* Test BFS from vertex 0 *)
  let output0 = capture_output (fun fmt -> bfs g 0 fmt) in
  let expected = "0 1 4 2 3\n" in
  check string "BFS from 0" expected output0

let () =
  run "Graph DFS Tests"
    [
      ("DFS", [ test_case "DFS traversal" `Quick test_dfs ]);
      ("BFS", [ test_case "BFS traversal" `Quick test_bfs ]);
    ]
