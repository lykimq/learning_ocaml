open Ocaml_trees.Avl_tree

module File_System_Avl_Tree_Balance : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node AVL_Tree.avl_tree }
  and node = File of file | Directory of directory

  val string_of_node : node -> string
  val print_node_avl_tree : node AVL_Tree.avl_tree -> string -> unit
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

  (* Escape non-printable characters replaces non-printable characters with a
     hexadecimal.
     For example: '\x1f'

     Use case: useful for debugging or logging where readability of
     non-printable characters is important. Common in debugging and error
     reporting where the exact byte values of non-printable characters need to
     be visible.
  *)
  let escape_string s =
    let buf = Buffer.create (String.length s) in
    String.iter
      (fun c ->
        match c with
        | ' ' .. '~' ->
            (* Add printable as-is *)
            Buffer.add_char buf c
        | _ ->
            (* Replace non-printable characters with \xNN format *)
            Buffer.add_string buf (Printf.sprintf "\\x%02x" (Char.code c)))
      s;
    (* Convert the buffer to a string *)
    Buffer.contents buf

  (* Convert a string to its hexadecimal representation For example: '61' for
     'a'

     Use-case: it is often used in situations where you need a compact and
     human-reabable representation of binary data. It is commonly used in
     network protocols and file formats.
  *)
  let _hex_of_string s =
    let hex = "0123456789abcdef" in
    let buf = Buffer.create (2 * String.length s) in
    String.iter
      (fun c ->
        (* Add a high nibble of the character *)
        Buffer.add_char buf (String.get hex (Char.code c lsr 4));
        (* Add a low nibble of the character *)
        Buffer.add_char buf (String.get hex (Char.code c land 0x0f)))
      s;
    Buffer.contents buf

  (* Convert a string to a readable format, replacing non-printable characters.
     Similar to espace_string, but ensure all characters are printed in a human
     readable form. It adds printable characters directly and replaces
     non-printable ones with hexadecimal.

     Use-case: ideal for debugging and logging where you want to see both
     printable and non-printable characters clearly. It is useful when you need
     to understand a string with mixed content
  *)
  let _readable_of_string s =
    let buf = Buffer.create (String.length s) in
    String.iter
      (fun c ->
        if c >= ' ' && c <= '~' then
          (* Add printable characters as-is *)
          Buffer.add_char buf c
        else
          (* Replace non-printable characters with \xNN format *)
          Buffer.add_string buf (Printf.sprintf "\\x%02x" (Char.code c)))
      s;
    Buffer.contents buf

  (* Convert a string to its base64 representation. Base64 encoding transforms
     binary data into an ASCII string format by encoding every three bytes into
     four characters.

     Use-case: Base64 is commonly used for encoding binary data for text-based
     systems, such as in email attachments, data URLs, and some web APIs. It is
     popular in web applications and data serialization. *)
  let _base64_of_string s =
    let b64 =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    in
    let pad =
      if String.length s mod 3 = 0 then ""
      else String.make (3 - (String.length s mod 3)) '='
    in
    let rec encode acc i =
      if i >= String.length s then acc
      else
        let a = Char.code s.[i] in
        let b = if i + 1 < String.length s then Char.code s.[i + 1] else 0 in
        let c = if i + 2 < String.length s then Char.code s.[i + 2] else 0 in
        let triplet = (a lsl 16) lor (b lsl 8) lor c in
        let enc = Bytes.create 4 in
        Bytes.set enc 0 b64.[(triplet lsr 18) land 0x3f];
        Bytes.set enc 1 b64.[(triplet lsr 12) land 0x3f];
        Bytes.set enc 2 b64.[(triplet lsr 6) land 0x3f];
        Bytes.set enc 3 b64.[triplet land 0x3f];
        let enc =
          if i + 2 >= String.length s then
            Bytes.sub_string enc 0 (4 - (3 - (String.length s mod 3)))
          else Bytes.to_string enc
        in
        encode (acc ^ enc) (i + 3)
    in
    encode "" 0 ^ pad

  let string_of_node node =
    match node with
    | File { name; content } ->
        Printf.sprintf "File(name: %s, content: %s)" (escape_string name)
          (escape_string content)
    | Directory { name; _ } ->
        Printf.sprintf "Directory(name: %s)" (escape_string name)

  let rec print_node_avl_tree tree indent =
    match tree with
    | AVL_Tree.Empty -> Printf.printf "%sEmpty\n" indent
    | AVL_Tree.Node { value; left; right; _ } ->
        Printf.printf "%s%s\n" indent (string_of_node value);
        print_node_avl_tree left (indent ^ " ");
        print_node_avl_tree right (indent ^ "  ")

  let remove_node name node =
    match node with
    | File _ ->
        (* If the node is a file, it cannot be removed because
           removal only applies for directories *)
        node
    | Directory d ->
        (* Create dummy node with the name to remove *)
        let dummy_file = File { name; content = "" } in
        Printf.printf "Removing node with name: %s\n" name;
        Printf.printf "Current tree:\n";
        print_node_avl_tree d.children "";
        let new_children = AVL_Tree.delete dummy_file d.children in
        Printf.printf "Tree after removal:\n";
        print_node_avl_tree new_children "";
        (* Create a dummy Directory node with the name to remove, and an empty AVL tree *)
        (*let node_to_remove = Directory { name; children = AVL_Tree.empty } in
          Printf.printf "Removing node with name: %s\n" name;
          Printf.printf "Current tree:\n";
          print_avl_tree d.children "";
          (* Remove the node with the specified name from the AVL tree of children *)
          let new_children = AVL_Tree.delete node_to_remove d.children in
          Printf.printf "Tree after removal:\n";
          print_avl_tree new_children "";*)
        Directory { d with children = new_children }
end
