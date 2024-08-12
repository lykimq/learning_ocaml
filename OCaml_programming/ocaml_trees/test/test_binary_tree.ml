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
  (* tree:    [10;5;20;15]
     inorder: [5;10;15;20] *)
  let tree = empty |> insert 10 |> insert 5 |> insert 20 |> insert 15 in
  let result = inorder tree in
  assert_equal result [ 5; 10; 15; 20 ]

let test_preorder _ =
  let open Binary_Tree in
  (* tree:     [10; 5; 20; 15]
     preorder: [10; 5; 20; 15]*)
  let tree = empty |> insert 10 |> insert 5 |> insert 20 |> insert 15 in
  let result = preorder tree in
  assert_equal result [ 10; 5; 20; 15 ]

let test_postorder _ =
  let open Binary_Tree in
  (* tree: [10; 5; 20; 15]
     postorder: [5; 15; 20; 10] *)
  let tree = empty |> insert 10 |> insert 5 |> insert 20 |> insert 15 in
  let result = postorder tree in
  assert_equal result [ 5; 15; 20; 10 ]

let test_suite =
  "Binary Tree Test Suite"
  >::: [
         "test_insert_search" >:: test_insert_search;
         "test_inorder" >:: test_inorder;
         "test_preorder" >:: test_preorder;
         "test_postorder" >:: test_postorder;
       ]

let () = run_test_tt_main test_suite
