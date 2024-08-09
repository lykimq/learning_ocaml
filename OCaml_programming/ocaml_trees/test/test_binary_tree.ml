open OUnit2
open Ocaml_trees.Binary_tree

let test_insert_search _ =
  let open Binary_Tree in
  let tree = Binary_Tree.empty |> insert 10 |> insert 5 |> insert 20 in
  assert_equal (search 10 tree) true;
  assert_equal (search 5 tree) true;
  assert_equal (search 20 tree) true;
  assert_equal (search 15 tree) false

let test_inorder _ =
  let open Binary_Tree in
  let tree = empty |> insert "10" |> insert "5" |> insert "20" |> insert "15" in
  let () = print_tree tree in
  let result = inorder tree in
  let () = List.iter (fun i -> Printf.printf " %s " i) result in
  assert_equal result [ "5"; "20"; "15"; "10" ]

let test_suite =
  "Binary Tree Test Suite"
  >::: [
         "test_insert_search" >:: test_insert_search;
         "test_inorder" >:: test_inorder;
       ]

let () = run_test_tt_main test_suite
