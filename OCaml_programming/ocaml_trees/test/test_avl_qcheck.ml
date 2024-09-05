open Ocaml_trees.Avl_tree

(* Insearch property:
   - If an element is in the tree, it should be found by search function.
*)
let test_insert =
  let open AVL_Tree in
  QCheck2.Test.make
    ~name:"insearch and search" (* Abitrary generator for integer elements *)
    QCheck2.Gen.int (* Define the test property *) (fun x ->
      let tree = empty in
      let tree' = insert ~cmp:compare x tree in
      search ~cmp:compare x tree')

(* Test insertion preserves search
   - After insearting an element, all previously inserted elements should still be
     found in the tree.
*)

let test_insertion_search =
  let open AVL_Tree in
  let open QCheck2 in
  Test.make ~name:"insertion preserves search"
    (Gen.list_size (Gen.return 10) Gen.int)
    (fun xs ->
      let tree =
        List.fold_left (fun acc x -> insert ~cmp:compare x acc) empty xs
      in
      List.for_all (fun x -> search ~cmp:compare x tree) xs)

(* Test the deletion property:
   - When the element is deleted it cannot be found by using search
*)

let test_delete =
  let open AVL_Tree in
  let open QCheck2 in
  Test.make ~name:"delete and search"
    (Gen.list_size (Gen.return 10) Gen.int)
    (fun xs ->
      let tree =
        List.fold_left (fun acc x -> insert ~cmp:compare x acc) empty xs
      in
      let tree' =
        List.fold_left (fun acc x -> delete ~cmp:compare x acc) tree xs
      in
      List.for_all (fun x -> not (search ~cmp:compare x tree')) xs)

(* Check if the tree is still balance or not *)
let is_balanced tree =
  let open AVL_Tree in
  let rec check_balance = function
    | Empty -> (true, 0) (* A tree with no nodes is balanced, height is 0 *)
    | Node { left; right; _ } ->
        let left_balanced, left_height = check_balance left in
        let right_balanced, right_height = check_balance right in
        (* the left, right and the absolute different in height between
           the left and the right subtrees is at most 1 *)
        let balanced =
          left_balanced && right_balanced
          && abs (left_height - right_height) <= 1
        in
        (* current height aka balance *)
        let height = 1 + max left_height right_height in
        (balanced, height)
  in
  fst (check_balance tree)

(* Test that the tree maintains the AVL property *)
let test_avl_property =
  let open QCheck2 in
  let open AVL_Tree in
  Test.make ~name:"AVL property"
    (Gen.list_size (Gen.return 10) Gen.int)
    (fun xs ->
      let tree =
        List.fold_left (fun acc x -> insert ~cmp:compare x acc) empty xs
      in
      is_balanced tree)

let _ =
  QCheck_runner.run_tests_main
    [ test_insert; test_insertion_search; test_delete; test_avl_property ]
