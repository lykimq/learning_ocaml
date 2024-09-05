open Ocaml_trees.Avl_tree

module File_System_Avl_Tree_Balance : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node AVL_Tree.avl_tree }
  and node = File of file | Directory of directory

  val string_of_node : node -> string
  val compare_nodes : node -> node -> int
  val insert_node : node -> node -> node
  val print_node_avl_tree : node AVL_Tree.avl_tree -> string -> unit
  val add_file : node -> file -> node
  val print_filesystem : node -> string -> unit
  val find_directory : string list -> node -> node option
  val remove_node : node -> node -> node
end = struct
  type file = { name : string; content : string }

  type directory = { name : string; children : node AVL_Tree.avl_tree }
  and node = File of file | Directory of directory

  let compare_nodes node1 node2 =
    match (node1, node2) with
    | File f1, File f2 -> String.compare f1.name f2.name
    | Directory d1, Directory d2 -> String.compare d1.name d2.name
    | File _, Directory _ -> -1
    | Directory _, File _ -> 1

  let insert_node node1 node2 =
    match node1 with
    | File _ -> failwith "Cannot insert a node into a file"
    | Directory d ->
        let new_children =
          AVL_Tree.insert ~cmp:compare_nodes node2 d.children
        in
        Directory { d with children = new_children }

  let add_file dir file =
    match dir with
    | File _ -> failwith "Cannot add a file to a file"
    | Directory _ as node -> insert_node node (File file)

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

  let string_of_node node =
    let open String_conversion in
    match node with
    | File { name; content } ->
        Printf.sprintf "File(name: %s, content: %s)"
          (String_Conversion.escape_string name)
          (String_Conversion.escape_string content)
    | Directory { name; _ } ->
        Printf.sprintf "Directory(name: %s)"
          (String_Conversion.escape_string name)

  let rec print_node_avl_tree tree indent =
    match tree with
    | AVL_Tree.Empty -> Printf.printf "%sEmpty\n" indent
    | AVL_Tree.Node { value; left; right; _ } ->
        Printf.printf "%s%s\n" indent (string_of_node value);
        print_node_avl_tree left (indent ^ " ");
        print_node_avl_tree right (indent ^ "  ")

  let rec find_directory path node =
    let open String_conversion in
    match (path, node) with
    | [], Directory d -> Some (Directory d)
    | p :: ps, Directory d -> (
        let rec find_in_tree tree =
          match tree with
          | AVL_Tree.Empty -> None
          | AVL_Tree.Node { value; left; right; _ } -> (
              match value with
              | Directory dir when dir.name = p ->
                  (* If the current node's value matches the name 'p',
                      return this directory *)
                  Some dir
              | _ -> (
                  (* If the current node's value does not match,
                     continue to search in the left and right subtrees *)
                  match find_in_tree left with
                  | Some found_dir -> Some found_dir
                  | None -> find_in_tree right))
        in
        (* Perform the search in the AVL tree of the current directory *)
        let next_dir = find_in_tree d.children in
        match next_dir with
        | Some dir ->
            (* If the directory is found, continue to search in the remaining path *)
            find_directory ps (Directory dir)
        | None ->
            (* If the directory is not found *)
            Printf.eprintf "Error: Directory %s is not found\n"
              (String_Conversion.escape_string p);
            None)
    | _ ->
        Printf.eprintf "Error: Invalid path.\n";
        None

  let remove_node node node_to_remove =
    match node with
    | Directory d ->
        let new_children =
          AVL_Tree.delete ~cmp:compare_nodes node_to_remove d.children
        in
        Directory { d with children = new_children }
    | _ -> failwith "Cannot remove a node from a file"
end
