open Ocaml_trees.Patricia_tree
open Alcotest

let test_insert () =
  let open Patricia_Tree in
  let empty_tree = None in
  let tree = ref empty_tree in
  tree := insert "comet" !tree;
  tree := insert "commute" !tree;
  tree := insert "com" !tree;
  (* Convert to list and check the expected order *)
  let result = to_list !tree in
  check (list string) "check insertion "
    [ "com"; "comet"; "commute" ]
    (List.sort compare result)

let test_find () =
  let open Patricia_Tree in
  let tree = ref None in
  tree := insert "comet" !tree;
  tree := insert "commute" !tree;
  tree := insert "com" !tree;
  (* Check that the strings are found *)
  check bool "found comet" true (find "comet" !tree);
  check bool "found commute" true (find "commute" !tree);
  check bool "found com" true (find "com" !tree)

let test_delete () =
  let open Patricia_Tree in
  let tree = ref None in
  tree := insert "comet" !tree;
  tree := insert "commute" !tree;
  tree := insert "com" !tree;
  tree := delete "comet" !tree;
  (* Convert to list and check the expected order *)
  let result = to_list !tree in
  check (list string) "check deletion" [ "com"; "commute" ]
    (List.sort compare result);
  (* Check that the deleted string is not found *)
  check bool "find 'comet' after deletion" false (find "comet" !tree)

let test_empty () =
  let open Patricia_Tree in
  let tree = None in
  (* An empty tree should have no string *)
  check (list string) "check empty tree" [] (to_list tree);
  (* Nothing shoudl be found *)
  check bool "find in empty tree" false (find "anything" tree)

let () =
  run "Patricia Tree Tests"
    [
      ("Insert Tests", [ test_case "Insert and List" `Quick test_insert ]);
      ("Find Tests", [ test_case "Find" `Quick test_find ]);
      ("Delete Tests", [ test_case "Delete" `Quick test_delete ]);
      ("Empty Tests", [ test_case "Empty" `Quick test_empty ]);
    ]
