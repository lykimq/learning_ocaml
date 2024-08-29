module Patricia_Tree : sig
  type node = {
    prefix : string;
    children : (char * node) list;
    is_terminal : bool;
  }

  type t = node option

  val empty : t option
  val find : string -> node option -> bool
  val insert : string -> node option -> node option
  val delete : string -> node option -> node option
  val to_list : node option -> string list
end = struct
  type node = {
    prefix : string;
    children : (char * node) list;
    is_terminal : bool;
  }

  type t = node option

  let empty = None

  let common_prefix s1 s2 =
    let rec aux idx =
      (* Check if the current index is within the bound of both strings.
         And if the characters at this index are the same in both strings. *)
      if idx < String.length s1 && idx < String.length s2 && s1.[idx] = s2.[idx]
      then (* If it matches continue to the next idex *)
        aux (idx + 1)
      else
        (* If characters don't match or we reach the end of one string,
           return the common prefix found so far *)
        String.sub s1 0 idx
    in
    aux 0

  (* Insert a string into a list of children nodes *)
  let rec insert_in_children s children =
    match children with
    | [] ->
        (* No children exist, create a new node with new string *)
        [ (s.[0], { prefix = s; children = []; is_terminal = true }) ]
    | (c, child_node) :: rest ->
        (* Check if the first character of the string matches the current child node

           Example: Tree has node with "com" and we insert "commute"
           - Common prefix "com" found, we proceed to insert into this node.
           - We split "com" to accommodate the new string "commute"
        *)
        if c = s.[0] then
          (* Insert the string into the matching child node *)
          (c, insert_node s child_node) :: rest
        else
          (* If there is no match, keep the current child node and proceed
             with the rest *)
          (c, child_node) :: insert_in_children s rest

  (* Insert a string into an existing node *)
  and insert_node s node =
    (* Find the common prefix between the string and the node's prefix *)
    let common = common_prefix s node.prefix in
    let len_comm = String.length common in
    let len_prefix = String.length node.prefix in
    let len_s = String.length s in

    if len_comm = len_prefix then
      (* Case 1: the entire prefix of the node is a common prefix
         with the string

         Example: Tree has node "com", and we are inserting "commute"
         - The remaining string after "com" is "mute"
         - Insert "mute" into the children of the "com" node
      *)
      if len_comm = len_s then
        (* Exact match, just mark as terminal *)
        { node with is_terminal = true }
      else
        (* Otherwise, continue inserting the remaining part of the string *)
        let remaining_s = String.sub s len_comm (len_s - len_comm) in
        let updated_children = insert_in_children remaining_s node.children in
        { node with children = updated_children }
    else
      (* Case 2: The common prefix is smaller than the node's prefix,
          meaning the node needs to be split.
             Split the current node and insert

         Example: Tree has node "comet", and we are inserting "commute"
         - Common prefix: "com" is shorter than "comet"
         - Split "comet" -> "et" and create a new branch "mute"
         - The tree will now have node "com" with 2 branches: "et" and "mute"
      *)
      let remaining_prefix =
        String.sub node.prefix len_comm (len_prefix - len_comm)
      in
      (* Create a new node with the remaining part of the original node's prefix *)
      let new_node =
        {
          prefix = remaining_prefix;
          children = node.children;
          is_terminal = node.is_terminal;
        }
      in
      (* Create new child node for the remaining part of the string *)
      let remaining_s = String.sub s len_comm (len_s - len_comm) in
      let new_child =
        { prefix = remaining_s; children = []; is_terminal = true }
      in
      (* Return a new node with the common prefix and two children:
         the split node and the new child *)
      {
        prefix = common;
        children =
          [ (remaining_prefix.[0], new_node); (remaining_s.[0], new_child) ];
        is_terminal = false;
      }

  (* Insert a string into the Patricia tree *)
  let insert s tree =
    match tree with
    | None -> Some { prefix = s; children = []; is_terminal = true }
    | Some node -> Some (insert_node s node)

  (* Search for a string in a list of children node *)
  let rec find_in_children s children =
    match children with
    | [] -> false
    | (c, child_node) :: rest ->
        (* Check if the first character of the string matches the current child node
           Example:
           Input:
           s = "commute",
           children = [('c', node1); ('x'; node2)]

           - Check if the first character 's'('c') matches the first character of
             the first child node ('c')

           If they match, recursively search for "commute" in "node1".
           If not continue with the rest of the children node
        *)
        if c = s.[0] then find_node s child_node else find_in_children s rest

  (* Search a string in an existing node *)

  and find_node s node =
    (* Find the common prefix between the string and the node's prefix *)
    let common = common_prefix s node.prefix in
    let len_comm = String.length common in
    let len_prefix = String.length node.prefix in
    let len_s = String.length s in

    if len_comm = len_prefix then
      (* Case 1: The entire prefix of the node is a common prefix with the string
         Example:

         input: s = "commute", node.prefix = "comm"
         common_prefix = "comm"

         - common_prefix "comm" is not equal to entire string "commute"
         - Extract the remaining part of the string "mute" and search it
           in the children of the node.
      *)
      if len_comm = len_s then
        (* Example:
            input: s = "comm", node.prefix = "comm"
            common_prefix = "comm"
           - The common_prefix "comm" is equal to the entire string "comm",
             so check if the node is terminal
        *)
        node.is_terminal
      else
        (* Otherwise search for the remaining part of the string in the node's children *)
        let remaining_s = String.sub s len_comm (len_s - len_comm) in
        find_in_children remaining_s node.children
    else
      (* Case 2: the common prefix is not the entire prefix of the node.
                  Meaning the string is not found *)
      false

  (* Search for a string in the Patricia tree *)
  let find s tree =
    match tree with None -> false | Some node -> find_node s node

  let rec delete_in_children s children =
    match children with
    | [] -> []
    | (c, child_node) :: rest ->
        (* Check if the first character of the string matches the current child node
           Example:
           input:
           s = "commute"
           children = [('c', node1); ('x', node2)]

           - Check the first character of 's'('c') matches the first
             character of the first child node ('c')
           - If they match, recursively delete "commute" in "node1".
           - If not, continue with the remaining children
        *)
        if c = s.[0] then
          (* If it matches, attemp to delete the string from the matching child node *)
          match delete_node s child_node with
          | None ->
              (* If the child node is deleted, remove it from the children list *)
              rest
          | Some new_child ->
              (* If the child node is updated, include it in the list of children *)
              (c, new_child) :: rest
        else
          (* It not, return as it is and continue searching in the rest of the children
        *)
          (c, child_node) :: delete_in_children s rest

  (* Delete a string from an existing node *)
  and delete_node s node =
    (* Find a common prefix between the string and the node's prefix *)
    let common = common_prefix s node.prefix in
    let len_comm = String.length common in
    let len_prefix = String.length node.prefix in
    let len_s = String.length s in

    if len_comm = len_prefix then
      (* Case 1: The entire prefix of the node is a common prefix with the string
         Example
         Input:
         s = "commute"
         node.prefix = "comm"

         - common_prefix is "comm"
         - Check if node matches "commute"
            + If node has no children, it can be deleted
            + If node has exactly one children, collapse it by combining the prefix
              node.children = [("u", node2)]
              combine "comm" with "u" and update the node.
            + if node has multiple children, mark it as non-terminal
      *)
      if len_comm = len_s then
        (* If the common prefix matches the entire string, we have found the node to delete *)
        match node.children with
        | [] -> None
        | [ (_, only_child) ] ->
            (* If the node has exactly one child, collaps the node by combining the prefix *)
            Some { only_child with prefix = common ^ only_child.prefix }
        | _ ->
            (* If the node has multiple children, just mark this node as non-terminal *)
            Some { node with is_terminal = false }
      else
        (* Case 2: The common prefix is patrial, so conitnue to delete in the childen nodes
           Example:
           input
           s = "commute"
           node.prefix = "com"

           - common_prefix is "com"
           - Extract remainging stirng "mute" and delete it from the children nodes of 'node
             node.children = [("m", child_node)]
             + attemp to delete "mute" in "child_node"
             + update the list of children if necessary
        *)
        let remaining_s = String.sub s len_comm (len_s - len_comm) in
        let updated_children = delete_in_children remaining_s node.children in
        Some { node with children = updated_children }
    else
      (* Case 3: The common prefix does not match the entire prefix, meaning node found
         Example:
         input:
         s = "commute"
         node.prefix = "ex"

         - common_prefix : "ex"

         The common prefix does not match the entire prefix, return the original
         ndoe as no deletion is performed
      *)
      Some node

  (* Delete a string from the Patricia tree *)
  let delete s tree =
    match tree with None -> None | Some node -> delete_node s node

  (* Convert a node to a list of strings *)
  let rec to_list_node node =
    (* Convert all children node to a list of strings *)
    let child_strings =
      List.flatten
        (List.map (fun (_, child) -> to_list_node child) node.children)
    in
    (* Combine the prefix of the current node with the strings from its children*)
    let full_strings = List.map (fun s -> node.prefix ^ s) child_strings in
    (* If the current node is terminal, include its prefix as a complete string *)
    if node.is_terminal then node.prefix :: full_strings else full_strings

  (* Convert the Patricia tree to a list of strings *)
  let to_list tree =
    match tree with None -> [] | Some node -> to_list_node node
end
