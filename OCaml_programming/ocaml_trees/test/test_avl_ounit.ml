open OUnit2
open Ocaml_trees.Avl_tree

let test_right_rotate_empty _ =
  let open AVL_Tree in
  let tree = empty in
  assert_equal tree (rotate_right tree)

let test_right_rotate _ =
  (*
          30      =>    20
          /             /\
         20            10 30
         /\
        10

  *)
  let open AVL_Tree in
  let tree =
    make_node 30 (make_node 20 (make_node 10 empty empty) empty) empty
  in
  let expected_tree =
    make_node 20 (make_node 10 empty empty) (make_node 30 empty empty)
  in
  assert_equal expected_tree (rotate_right tree)

let test_left_rotate _ =
  let open AVL_Tree in
  (*
            10              =>    20
             \                    /\
              20                 10 30
               \
               30
    *)
  let tree =
    make_node 10 empty (make_node 20 empty (make_node 30 empty empty))
  in
  let expected_tree =
    make_node 20 (make_node 10 empty empty) (make_node 30 empty empty)
  in
  assert_equal expected_tree (rotate_left tree)

let test_insert _ =
  let open AVL_Tree in
  let tree = empty in
  let tree = insert 10 tree in
  let tree = insert 20 tree in
  let tree = insert 30 tree in
  let expected_tree =
    make_node 20 (make_node 10 empty empty) (make_node 30 empty empty)
  in
  assert_equal expected_tree tree

let test_search _ =
  let open AVL_Tree in
  let tree = insert 10 (insert 20 (insert 30 empty)) in
  assert_equal true (search 20 tree);
  assert_equal false (search 40 tree)

let test_delete _ =
  let open AVL_Tree in
  let tree = insert 10 (insert 20 (insert 30 empty)) in
  let tree = delete 20 tree in
  let expected_tree = make_node 30 (make_node 10 empty empty) empty in
  assert_equal expected_tree tree;
  assert_equal false (search 20 tree)

let suite =
  "AVL Tree tests"
  >::: [
         "test_right_rotate_empty" >:: test_right_rotate_empty;
         "test_right_rotate" >:: test_right_rotate;
         "test_left_rotate" >:: test_left_rotate;
         "test_insert" >:: test_insert;
         "test_search" >:: test_search;
         "test_delete" >:: test_delete;
       ]

let () = run_test_tt_main suite
