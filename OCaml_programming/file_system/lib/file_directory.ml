module File_Directory : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node list }
  and node = File of file | Directory of directory

  val add_file : node -> file -> node
  val print_filesystem : node -> string -> unit
  val find_directory : string list -> node -> node option
  val remove_node : string -> node -> node
end = struct
  type file = { name : string; content : string }

  type directory = { name : string; children : node list }
  and node = File of file | Directory of directory

  let add_file dir file =
    match dir with
    | Directory d -> Directory { d with children = File file :: d.children }
    | _ -> failwith "Cannot add a file to a file"

  let rec print_filesystem fs indent =
    match fs with
    | File f -> Printf.printf "%sFile: %s\n" indent f.name
    | Directory d ->
        Printf.printf "%sDirectory: %s\n" indent d.name;
        List.iter
          (fun child -> print_filesystem child (indent ^ " "))
          d.children

  let rec find_directory path dir =
    match (path, dir) with
    | [], d ->
        (* Path is empty, return the current directory *)
        Some d
    | p :: ps, Directory d -> (
        (* Find the next directory in the path *)
        let next_dir =
          List.find_opt
            (function Directory d -> d.name = p | _ -> false)
            d.children
        in
        (* Continue to search in the next directory *)
        match next_dir with
        | Some (Directory d) -> find_directory ps (Directory d)
        | Some (File f) ->
            Printf.eprintf "Error: '%s' is a file, not a directory.\n" f.name;
            None
        | None ->
            Printf.eprintf "Error: Directory '%s' not found.\n" p;
            None)
    | _ ->
        Printf.eprintf "Error: Invalid path.\n";
        None

  let rec remove_node name dir =
    match dir with
    | Directory d ->
        let rec remove_from_list name nodes acc =
          match nodes with
          | [] -> List.rev acc
          | (File f as node) :: rest ->
              if f.name = name then
                (* Node found, skipt it to remove *)
                List.rev_append acc rest
              else
                (* Node does not match, keep it and continue *)
                remove_from_list name rest (node :: acc)
          | (Directory d as node) :: rest ->
              if d.name = name then
                (* Node found, skip it to remove *)
                List.rev_append acc rest
              else
                (* Recursively remove within the directory if needed *)
                let updated_dir = remove_node name node in
                remove_from_list name rest (updated_dir :: acc)
        in
        Directory { d with children = remove_from_list name d.children [] }
    | File _ -> failwith "Cannot remove a file"
end
