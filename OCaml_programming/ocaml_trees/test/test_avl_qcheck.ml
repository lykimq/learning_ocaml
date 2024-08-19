open Ocaml_trees.Avl_tree

let test_insert =
  let open AVL_Tree in
  QCheck2.Test.make
    ~name:"insearch and search" (* Abitrary generator for integer elements *)
    QCheck2.Gen.int (* Define the test property *) (fun x ->
      let tree = empty in
      let tree' = insert x tree in
      search x tree')

let _ = QCheck_runner.run_tests_main [ test_insert ]
