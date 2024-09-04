module File_System_Simple_Balance : sig
  type file = { name : string; content : string }

  type directory = { name : string; children : node list }
  and node = File of file | Directory of directory

  val calculate_depth : node -> int
  val add_file_balanced : node -> file -> node
  val print_filesystem : node -> string -> unit
  val find_directory : string list -> node -> node option
  val remove_node : string -> node -> node
end = struct
  type file = { name : string; content : string }

  type directory = { name : string; children : node list }
  and node = File of file | Directory of directory

  (* A helper function that calculates the current depth of a directory. It
     recursively traverses the directory structure and returns the maximum depth
  *)
  let rec calculate_depth dir =
    match dir with
    | File _ -> 0
    | Directory d ->
        1
        + List.fold_left
            (fun acc child -> max acc (calculate_depth child))
            0 d.children

  (* Takes the first n elements in the list *)
  let rec take n lst =
    match (n, lst) with
    | 0, _ -> []
    | _, [] -> []
    | n, x :: xs -> x :: take (n - 1) xs

  (* Drop the first n elements in the list *)

  let rec drop n lst =
    match (n, lst) with
    | 0, lst -> lst
    | _, [] -> []
    | n, _ :: xs -> drop (n - 1) xs

  let rebalance_directory node =
    let max_children = 6 in
    match node with
    | File _ -> node
    | Directory d ->
        let children = List.rev d.children in
        if List.length children <= max_children then Directory d
        else
          let rec split_list lst acc =
            match lst with
            | [] -> List.rev acc
            | lst ->
                let part = take max_children lst |> List.rev in
                let rest = drop max_children lst |> List.rev in
                let new_dir =
                  Directory
                    {
                      name = d.name ^ "_" ^ string_of_int (List.length acc + 1);
                      children = part;
                    }
                in
                (* Add the new directory to the result and continue to process
                   the rest *)
                split_list rest (new_dir :: acc)
          in
          let new_dirs = split_list children [] in
          Directory
            { name = d.name; children = List.map (fun nd -> nd) new_dirs }

  let add_file_balanced dir file =
    match dir with
    | Directory d ->
        let updated_dir =
          Directory { d with children = File file :: d.children }
        in
        rebalance_directory updated_dir
    | _ -> failwith "Cannot add a file to a file"

  let rec print_filesystem fs indent =
    match fs with
    | File f -> Printf.printf "%sFile: %s\n" indent f.name
    | Directory d ->
        Printf.printf "%sDirectory: %s\n" indent d.name;
        List.iter
          (fun child -> print_filesystem child (indent ^ " "))
          (List.rev d.children)

  let rec find_directory path dir =
    match (path, dir) with
    | [], d -> Some d
    | p :: ps, Directory d -> (
        let next_dir =
          List.find_opt
            (function Directory d -> d.name = p | _ -> false)
            d.children
        in
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
                (* Remove the file from the list *)
                List.rev_append acc rest
              else
                (* Keep the file in the list and continues processing *)
                remove_from_list name rest (node :: acc)
          | (Directory d as node) :: rest ->
              if d.name = name then
                (* Remove the folder from the list *)
                List.rev_append acc rest
              else
                (* recursively call [remove_node] on the directory to process
                   its children *)
                let updated_dir = remove_node name node in
                (* Continue processing the remaining nodes *)
                remove_from_list name rest (updated_dir :: acc)
        in
        (* Create a new directory with the updated list of children *)
        Directory { d with children = remove_from_list name d.children [] }
    | File _ -> failwith "Cannot remove a file"
end
