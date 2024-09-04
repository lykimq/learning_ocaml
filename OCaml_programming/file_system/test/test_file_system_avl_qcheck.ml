open Ocaml_trees.Avl_tree
open File_system.File_system_avl_tree_balance
open QCheck2

(* Generate a random file with a name and content *)
let gen_file =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  let* name = Gen.string_size (Gen.return 10) in
  let* content = Gen.string_size (Gen.return 50) in
  return { name; content }

(* Generate a random directory with a specified depth *)
let rec gen_directory depth =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  let* name = string_size (return 10) in
  let* children =
    if depth = 0 then return AVL_Tree.empty
    else
      list_size (int_range 0 5) (gen_node (depth - 1)) >>= fun children_list ->
      let rec insert_list tree = function
        | [] -> return tree
        | hd :: tl -> insert_list (AVL_Tree.insert hd tree) tl
      in
      insert_list AVL_Tree.empty children_list
  in
  return (Directory { name; children })

(* Generate a random node which could be a file or a directory *)
and gen_node depth =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  let* is_file = bool in
  if is_file then gen_file >>= fun file -> return (File file)
  else gen_directory depth >>= fun dir -> return dir

(* Generate a random file system *)
let gen_filesystem depth = gen_node depth

(* Test adding a file to a directory *)
let test_add_file =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  Test.make ~count:1000
    (* Generate a directory and a file for the test *)
    ( gen_directory 3 >>= fun d ->
      gen_file >>= fun f -> return (d, f) )
    (* Test function to check if adding a file works correctly *)
      (fun (dir, file) ->
      match dir with
      | Directory _d -> (
          (* Add a file to the directory *)
          let new_dir = add_file dir file in
          match new_dir with
          | Directory d' ->
              (* Check if the file was successfully added *)
              AVL_Tree.search (File file) d'.children
          | _ -> false)
      | _ -> false)

let debug_search tree node =
  let open File_System_Avl_Tree_Balance in
  let found = AVL_Tree.search node tree in
  Printf.printf "Searching for node: %s, Found: %b\n" (string_of_node node)
    found;
  found

let test_add_file_debug_search =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  Test.make ~count:1000
    ( gen_directory 3 >>= fun d ->
      gen_file >>= fun f -> return (d, f) )
    (fun (dir, file) ->
      match dir with
      | Directory _ -> (
          let new_dir = add_file dir file in
          match new_dir with
          | Directory d' ->
              let result = debug_search d'.children (File file) in
              result
          | _ -> false)
      | _ -> false)

let _test_remove_node_file =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  Test.make ~count:3000
    ( gen_directory 3 >>= fun d ->
      gen_file >>= fun f -> return (d, f) )
    (fun (dir, file) ->
      let dir_with_file = add_file dir file in
      let dir_after_removal = remove_node file.name dir_with_file in
      match dir_after_removal with
      | Directory d' ->
          let result = not (AVL_Tree.search (File file) d'.children) in
          Printf.printf "File %s removed: %b\n" file.name result;
          result
      | _ -> false)

let _test_remove_node =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  Test.make ~count:3000
    ( gen_directory 3 >>= fun d ->
      gen_file >>= fun f -> return (d, f) )
    (fun (dir, file) ->
      let dir_with_file = add_file dir file in
      let dir_after_removal = remove_node file.name dir_with_file in
      match dir_after_removal with
      | Directory d' ->
          let result = not (debug_search d'.children (File file)) in
          Printf.printf "File %s removed: %b\n" file.name result;
          result
      | _ -> false)

let debug_find_directory path fs =
  let open File_System_Avl_Tree_Balance in
  let result = find_directory path fs in
  Printf.printf "Testing path: %s\n" (String.concat "/" path);
  (match result with
  | Some _dir -> Printf.printf "Found directory\n"
  | None -> Printf.printf "Directory not found\n");
  result

let _test_find_directory =
  let open File_System_Avl_Tree_Balance in
  let open Gen in
  Test.make ~count:1000
    (* Generate a file system and a path for the test *)
    ( gen_filesystem 3 >>= fun fs ->
      list_size (return 3) (string_size (return 10)) >>= fun path ->
      return (fs, path) )
    (* Test function to check if the directory can be found by the path *)
      (fun (fs, path) ->
      match debug_find_directory path fs with
      | Some (Directory dir) ->
          (* If a directory is found, ensure it actually
             exists in the path *)
          let rec directory_exists current_node path_segments =
            match path_segments with
            | [] -> (
                match current_node with Directory d -> d = dir | _ -> false)
            (* No more segments to match, we should be at the
               correct directory *)
            | p :: ps -> (
                match find_directory [ p ] current_node with
                | Some next_dir -> directory_exists next_dir ps
                | _ -> false)
          in
          directory_exists fs path
      | Some (File _) | None ->
          (* If no directory is found *)
          let rec directory_exists dir path =
            match path with
            | [] -> true
            | p :: ps -> (
                match find_directory [ p ] dir with
                | Some d -> directory_exists d ps
                | _ -> false)
          in
          not (directory_exists fs path))

let () =
  QCheck_runner.run_tests_main [ test_add_file; test_add_file_debug_search ]
