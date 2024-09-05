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

  let rec find_directory path node =
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
              (escape_string p);
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
