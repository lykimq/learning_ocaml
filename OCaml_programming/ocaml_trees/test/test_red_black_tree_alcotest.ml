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

(* Test deletion:
   Delete black child, has grandchild is red

         (Black) 15                                        (Black) 15
              /   \                                         /    \
      (Black)10   20(Black)    --> delete 10 -->       (Black)5   20(Black)
           /  \
       (Red)5  empty
*)
let sample_tree_deletion =
  let open Red_Black_Tree in
  (*
        15 (black)
          /     \
      (black)10  20(black)
        /  \
(Red) 5    empty
*)
  Node
    {
      color = Black;
      value = 15;
      left =
        Node
          {
            color = Black;
            value = 10;
            left = Node { color = Red; value = 5; left = Empty; right = Empty };
            right = Empty;
          };
      right = Node { color = Black; value = 20; left = Empty; right = Empty };
    }

let test_deletion () =
  let open Red_Black_Tree in
  let tree = delete ~cmp:Int.compare 10 sample_tree_deletion in
  let expected_tree =
    Node
      {
        color = Black;
        value = 15;
        left = Node { color = Black; value = 5; left = Empty; right = Empty };
        right = Node { color = Black; value = 20; left = Empty; right = Empty };
      }
  in
  check tree_testable "delete 10 from tree" expected_tree tree

let test_delete_red_leaf () =
  let open Red_Black_Tree in
  let tree = delete ~cmp:Int.compare 5 sample_tree_deletion in
  let expected_tree =
    Node
      {
        color = Black;
        value = 15;
        left = Node { color = Black; value = 10; left = Empty; right = Empty };
        right = Node { color = Black; value = 20; left = Empty; right = Empty };
      }
  in
  check tree_testable "delete 5 red from tree" expected_tree tree

let test_delete_two_children () =
  let open Red_Black_Tree in
  (*
     (Black) 15                                (Black)15
          /    \                                 /   \
    (Black)10  20(Black)   ==> delete 10  (Black)5   20(Black)
       /  \                                     /\
  (Red)5  12(Red)                          empty  12(Red)
  *)
  let sample_tree =
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
              right =
                Node { color = Red; value = 12; left = Empty; right = Empty };
            };
        right = Node { color = Black; value = 20; left = Empty; right = Empty };
      }
  in
  let tree = delete ~cmp:Int.compare 10 sample_tree in
  let expected_tree =
    Node
      {
        color = Black;
        value = 15;
        left =
          Node
            {
              color = Black;
              value = 5;
              left = Empty;
              right =
                Node { color = Red; value = 12; left = Empty; right = Empty };
            };
        right = Node { color = Black; value = 20; left = Empty; right = Empty };
      }
  in
  check tree_testable "delelte 10 with two children" expected_tree tree

let test_remove_root () =
  let open Red_Black_Tree in
  (*
        15 (black)                 => (Black)10
          /     \                        /    \
      (black)10  20(black)         (Black)5    20(Black)
        /  \                            /  \
(Red) 5    empty                   empty   empty
*)
  let tree = delete ~cmp:Int.compare 15 sample_tree_deletion in
  let expected_tree =
    Node
      {
        color = Black;
        value = 10;
        left = Node { color = Black; value = 5; left = Empty; right = Empty };
        right = Node { color = Black; value = 20; left = Empty; right = Empty };
      }
  in
  check tree_testable "delete root 15" expected_tree tree

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
      ("delete", [ test_case "delete" `Quick test_deletion ]);
      ( "delete_red_leaf",
        [ test_case "delete_red_leaf" `Quick test_delete_red_leaf ] );
      ( "delete_two_children",
        [ test_case "delete_two_children" `Quick test_delete_two_children ] );
      ("delete_root", [ test_case "delete_root" `Quick test_remove_root ]);
    ]
