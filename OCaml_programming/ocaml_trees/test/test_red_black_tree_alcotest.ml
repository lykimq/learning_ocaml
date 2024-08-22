open Alcotest
open Ocaml_trees.Red_black_tree

(* Checking the equality for Red-Black Trees *)
let rec tree_equal t1 t2 =
  let open Red_Black_Tree in
  match (t1, t2) with
  | Empty, Empty -> true
  | ( Node { color = c1; value = v1; left = l1; right = r1 },
      Node { color = c2; value = v2; left = l2; right = r2 } ) ->
      c1 = c2 && v1 = v2 && tree_equal l1 l2 && tree_equal r1 r2
  | _, _ -> false

let tree_testable = Alcotest.testable Red_Black_Tree.print_tree tree_equal

let sample_tree =
  (*
          10 (black)
            /  \
        (red)5  20(red)
  *)
  let open Red_Black_Tree in
  Node
    {
      color = Black;
      value = 10;
      left = Node { color = Red; value = 5; left = Empty; right = Empty };
      right = Node { color = Red; value = 20; left = Empty; right = Empty };
    }

let test_insert () =
  (*
       10(black)              =>     10(black)
       /     \                        /   \
     (red)5   20 (red)           (black)5    20(red)
                                             /\
                                      (red)15  empty

  => recolor and rotate
      15(black)
      /    \
(black)10   20(black)
     /\         / \
(b)5  empty  empty  empty

  *)
  let open Red_Black_Tree in
  let tree = insert 15 sample_tree in
  let expected_tree =
    Node
      {
        color = Black;
        value = 15;
        left =
          Node
            {
              color = Black;
              value = 10;
              left =
                Node { color = Red; value = 5; left = Empty; right = Empty };
              right = Empty;
            };
        right = Node { color = Black; value = 20; left = Empty; right = Empty };
      }
  in
  check tree_testable "insert 15 to sample tree" expected_tree tree

let test_insert_empty () =
  let open Red_Black_Tree in
  let tree = insert 10 Empty in
  let expected_tree =
    Node { color = Black; value = 10; left = Empty; right = Empty }
  in
  check tree_testable "insert test empty" expected_tree tree

let () =
  run "Red-Black Tree Tests"
    [
      ("insert_empty", [ test_case "insert_empty" `Quick test_insert_empty ]);
      ("insert", [ test_case "insert" `Quick test_insert ]);
    ]
