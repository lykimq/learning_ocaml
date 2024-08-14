open OUnit2
open Ocaml_trees.Avl_tree

let test_right_rotate_empty _ =
  let open AVL_Tree in
  let tree = empty in
  assert_equal tree (right_rotate tree)

let test_right_rotate_simple_case _ =
  let open AVL_Tree in
  let build_left =
    let open AVL_Tree in
    build_node ~value:5 ~left:empty ~right:empty ~height:1
  in
  let tree = build_node ~value:10 ~left:build_left ~right:empty ~height:2 in
  (*
          10
          /\
         5
  *)
  let build_right = build_node ~value:10 ~left:empty ~right:empty ~height:1 in
  let expected_tree =
    build_node ~value:5 ~left:empty ~right:build_right ~height:2
  in
  let actual_tree = right_rotate tree in
  (*let expected_str = print_tree expected_tree in
    let actual_tree_str = print_tree actual_tree in
    Printf.printf "Expected_tree: %s\n" expected_str;
    Printf.printf "Actual_tree: %s\n" actual_tree_str;*)
  assert_equal actual_tree expected_tree

let test_left_rotate_simple_case _ =
  let open AVL_Tree in
  let build_right =
    let open AVL_Tree in
    build_node ~value:10 ~left:empty ~right:empty ~height:1
  in
  let tree = build_node ~value:5 ~left:empty ~right:build_right ~height:2 in

  (*
          5              10
          /\    ->       /
            10          5
  *)
  let build_left = build_node ~value:5 ~left:empty ~right:empty ~height:1 in
  let expected_tree =
    build_node ~value:10 ~left:build_left ~right:empty ~height:2
  in
  let actual_tree = left_rotate tree in
  (*let expected_str = print_tree expected_tree in
    let actual_tree_str = print_tree actual_tree in
    Printf.printf "Expected_tree: %s\n" expected_str;
    Printf.printf "Actual_tree: %s\n" actual_tree_str;*)
  assert_equal actual_tree expected_tree

let suite =
  "AVL Tree tests"
  >::: [
         "test_right_rotate_empty" >:: test_right_rotate_empty;
         "test_right_rotate_simple_case" >:: test_right_rotate_simple_case;
         "test_left_rotate_simple_case" >:: test_left_rotate_simple_case;
       ]

let () = run_test_tt_main suite
