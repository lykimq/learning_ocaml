open Ocaml_trees.Avl_tree
open File_system.File_system_avl_tree_balance
open File_System_Avl_Tree_Balance
open Alcotest

let create_file name content = { name; content }
let create_directory name = Directory { name; children = AVL_Tree.empty }

let rec find_file_content filename tree =
  match tree with
  | AVL_Tree.Empty -> None
  | AVL_Tree.Node { value; left; right; _ } -> (
      match value with
      | File { name; content } when name = filename -> Some content
      | _ -> (
          match find_file_content filename left with
          | Some content -> Some content
          | None -> find_file_content filename right))

let test_add_file () =
  let root = create_directory "root" in
  let file = create_file "test.txt" "Hello, World!" in
  let root_with_file = add_file root file in
  match root_with_file with
  | Directory { children; _ } -> (
      let found = AVL_Tree.search ~cmp:compare_nodes (File file) children in
      check bool "File is added to directory" true found;

      let file_content = find_file_content file.name children in
      match file_content with
      | Some content ->
          check string "File content is correct" "Hello, World!" content
      | None -> fail "File not found in directory")
  | _ -> fail "Expected a directory "

let test_find_directory () =
  let root = create_directory "root" in
  let sub_dir = create_directory "sub" in
  let root_with_subdir =
    insert_node
      (match root with
      | Directory d -> d
      | File _ -> fail "Expected a directory")
      sub_dir
  in
  match find_directory [ "sub" ] root_with_subdir with
  | Some (Directory { name; _ }) -> check string "Directory is found" "sub" name
  | _ -> fail "Expected to find 'sub' directory"

let test_find_non_existing_directory =
  let root = create_directory "root" in
  match find_directory [ "non_existing" ] root with
  | None -> check pass "Non-existing directory is not found" ()
  | _ -> fail "Expected to not find a directory"

(* Complex file structure:
   - Create root directory: root
   - Create 2 subdirs and a file: root/sub1/sub2/test.txt
   - Check that there exist the sub-directory `sub2`
   - Verify the content of the file.
*)

let test_complex_file_struture () =
  let root = create_directory "root" in
  let sub_dir1 = create_directory "sub1" in
  let sub_dir2 = create_directory "sub2" in

  let file = create_file "test.txt" "Hello, World!" in

  let root_subdir1 =
    insert_node
      (match root with Directory d -> d | _ -> fail "Expected a directory")
      sub_dir1
  in

  let root_subdir2 =
    insert_node
      (match root_subdir1 with
      | Directory d -> d
      | _ -> fail "Expected a directory")
      sub_dir2
  in

  let root_subdir2_with_file = add_file root_subdir2 file in

  let () =
    match root_subdir2_with_file with
    | Directory { children; _ } -> (
        let file_content = find_file_content file.name children in
        match file_content with
        | Some content ->
            check string "File content is correct" "Hello, World!" content
        | None -> fail "File not found in directory")
    | _ -> fail "Expected a directory"
  in
  let found = find_directory [ "sub2" ] root_subdir2 in
  check
    (option
       (of_pp (fun fmt d ->
            Format.fprintf fmt "%s"
              (match d with Directory d -> d.name | _ -> "File"))))
    "Found subdir" (Some sub_dir2) found

let () =
  let open Alcotest in
  run "File System AVL Tree Balance"
    [
      ( "File System Tests",
        [
          test_case "Add File to Directory" `Quick test_add_file;
          test_case "Find Existing Directory" `Quick test_find_directory;
          test_case "Find Non-Existing Directory" `Quick
            test_find_non_existing_directory;
          test_case "Complex File Structure" `Quick test_complex_file_struture;
        ] );
    ]
