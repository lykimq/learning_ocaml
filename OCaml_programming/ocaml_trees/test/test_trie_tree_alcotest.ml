open Ocaml_trees.Trie_tree
open Alcotest

let setup_trie () =
  let open Trie_Tree in
  let root = create_node () in
  insert root "hello";
  insert root "word";
  insert root "heaven";
  root

let test_insert_search () =
  let open Trie_Tree in
  let trie = setup_trie () in
  (* Test searching for inserted words *)
  check bool "hello present" (search trie "hello") true;
  check bool "word present" (search trie "word") true;
  check bool "heaven present" (search trie "heaven") true;
  (* Test searching for non-inserted words *)
  check bool "hellooo absent" (search trie "hellooo") false;
  check bool "he" (search trie "he") false

let test_prefix_operations () =
  let open Trie_Tree in
  let trie = create_node () in
  insert trie "hello";
  insert trie "heaven";
  insert trie "he";
  insert trie "helloworld";
  (* Test word with prefix*)
  check (list string) "words with prefix 'he'"
    (words_with_prefix trie "he")
    [ "he"; "heaven"; "hello"; "helloworld" ];
  (* Test word count with prefix *)
  check (list string) "all words" (all_words trie)
    [ "he"; "heaven"; "hello"; "helloworld" ];
  (* Test delete *)
  delete trie "hello";
  check bool "word 'hello' absent after delete" (search trie "hello") false;
  check (list string) "remaining words" (all_words trie)
    [ "he"; "heaven"; "helloworld" ]

let () =
  run "Trie Tests"
    [
      ( "insert and search",
        [ test_case "test insert and search" `Quick test_insert_search ] );
      ( "prefix operations",
        [ test_case "test prefix operations" `Quick test_prefix_operations ] );
    ]
