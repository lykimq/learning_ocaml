open Ocaml_trees.Avl_tree

module File_System_Avl_Tree_Balance : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node AVL_Tree.avl_tree }
  and node = File of file | Directory of directory

  val add_file : node -> file -> node
  val print_filesystem : node -> string -> unit
  val find_directory : string list -> node -> node option
  val remove_node : string -> node -> node
end = struct
  type file = { name : string; content : string }

  type directory = { name : string; children : node AVL_Tree.avl_tree }
  and node = File of file | Directory of directory

  let insert_node directory node =
    let new_children = AVL_Tree.insert node directory.children in
    Directory { directory with children = new_children }

  let add_file dir file =
    match dir with
    | File _ -> failwith "Cannot add a file to a file"
    | Directory d ->
        let new_file = File file in
        insert_node d new_file

  let rec print_filesystem node indent =
    match node with
    | File f -> Printf.printf "%sFile: %s\n" indent f.name
    | Directory d ->
        Printf.printf "%sDirectory: %s\n" indent d.name;
        let rec print_avl_tree tree =
          match tree with
          | AVL_Tree.Empty -> ()
          | AVL_Tree.Node { value; left; right; _ } ->
              print_filesystem value (indent ^ " ");
              print_avl_tree left;
              print_avl_tree right
        in
        print_avl_tree d.children

  let rec find_directory path node =
    match (path, node) with
    | [], Directory _ ->
        (* If the path is empty and the node is a directory,
           return this node *)
        Some node
    | p :: ps, Directory d -> (
        (* Search for the directory with the matching name in the AVL tree *)
        let rec find_in_tree tree =
          match tree with
          | AVL_Tree.Empty ->
              Printf.eprintf "Error: The tree is empty.\n";
              None
          | AVL_Tree.Node { value; left; right; _ } -> (
              match value with
              | Directory dir when dir.name = p ->
                  (* If the current node's value matches the name 'p',
                     return this directory *)
                  Some dir
              | _ -> (
                  (* If the current node's value does not match,
                     continue to search in the left and right subtrees *)
                  let left_result = find_in_tree left in
                  match left_result with
                  | Some _ ->
                      (* If the directory is found in the left subtree, return the result *)
                      left_result
                  | None ->
                      (* If not found in the left subtree, recursively search the right subtree *)
                      find_in_tree right))
        in
        (* Perform the search in the AVL tree of the current directory *)
        let next_dir = find_in_tree d.children in
        match next_dir with
        | Some dir ->
            (* If the directory is found, continue to search in the remaining path *)
            find_directory ps (Directory dir)
        | None ->
            (* If the directory is not found *)
            Printf.eprintf "Error: Directory %s is not found.\n" p;
            None)
    | _ ->
        Printf.eprintf "Error: Iinvalid path.\n";
        None

  let remove_node name node =
    match node with
    | File _ ->
        (* If the node is a file, it cannot be removed because
           removal only applies for directories *)
        node
    | Directory d ->
        (* Create a dummy Directory node with the name to remove, and an empty AVL tree *)
        let node_to_remove = Directory { name; children = AVL_Tree.empty } in
        (* Remove the node with the specified name from the AVL tree of children *)
        let new_children = AVL_Tree.delete node_to_remove d.children in
        Directory { d with children = new_children }
end
