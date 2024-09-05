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
  let root_with_subdir = insert_node root sub_dir in
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

  let root_subdir1 = insert_node root sub_dir1 in

  let root_subdir2 = insert_node root_subdir1 sub_dir2 in

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

let test_remove_node () =
  let root = create_directory "root" in
  let file1 = create_file "file1" "content1" in
  let file2 = create_file "file2" "content2" in
  let dir1 = create_directory "dir1" in
  let dir2 = create_directory "dir2" in

  let root = add_file root file1 in
  let root = add_file root file2 in
  let root = insert_node root dir1 in
  let root = insert_node root dir2 in
  let dir1 =
    match find_directory [ "dir1" ] root with
    | Some (Directory d) -> d
    | _ -> failwith "Directory dir1 should exists"
  in
  check string "Directory is found" "dir1" dir1.name;

  (* Remove file1 from root directory *)
  let root_after_removal = remove_node root (File file1) in
  let root_after_removal =
    match root_after_removal with
    | Directory d -> d
    | _ -> failwith "Expected Directory after removal"
  in

  (* Check that file1 has been removed *)
  let file1_removed =
    not
      (AVL_Tree.search ~cmp:compare_nodes (File file1)
         root_after_removal.children)
  in
  check bool "file1 should be removed" true file1_removed;

  (* Check that other nodes are still present *)
  let file2_exists =
    AVL_Tree.search ~cmp:compare_nodes (File file2) root_after_removal.children
  in
  let dir1_exists =
    AVL_Tree.search ~cmp:compare_nodes (Directory dir1)
      root_after_removal.children
  in
  let dir2_exists =
    AVL_Tree.search ~cmp:compare_nodes dir2 root_after_removal.children
  in
  check bool "file2 should exists" true file2_exists;
  check bool "dir1 should exists" true dir1_exists;
  check bool "dir2 should exists" true dir2_exists

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
          test_case "Remove node" `Quick test_remove_node;
        ] );
    ]
