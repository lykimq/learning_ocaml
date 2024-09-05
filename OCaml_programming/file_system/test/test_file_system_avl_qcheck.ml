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
        | hd :: tl ->
            insert_list (AVL_Tree.insert ~cmp:compare_nodes hd tree) tl
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
let _gen_filesystem depth = gen_node depth

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
              AVL_Tree.search ~cmp:compare_nodes (File file) d'.children
          | _ -> false)
      | _ -> false)

let () = QCheck_runner.run_tests_main [ test_add_file ]
