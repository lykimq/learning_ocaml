module Trie_Tree : sig
  (* Define the type for a trie node. Each node contains a hashtable
     of children and a boolean flag to indicate if the node marks the end
     of a word. *)
  type t = { children : (char, t) Hashtbl.t; mutable is_end_of_word : bool }

  val create_node : unit -> t
  val insert : t -> string -> unit
  val search : t -> string -> bool
  val all_words : t -> string list
  val words_with_prefix : t -> string -> string list
  val count_words_with_prefix : t -> string -> int
  val delete : t -> string -> unit
end = struct
  type t = { children : (char, t) Hashtbl.t; mutable is_end_of_word : bool }

  let create_node () =
    {
      children = Hashtbl.create 26;
      (* Assumes only lowercase letters *)
      is_end_of_word = false;
    }

  (* Insert a word into the trie. *)
  let insert root word =
    let rec insert_chars node chars =
      match chars with
      | [] -> node.is_end_of_word <- true
      | c :: rest ->
          (* Check if the current character is already a child *)
          let child_node =
            if Hashtbl.mem node.children c then Hashtbl.find node.children c
            else
              let new_node = create_node () in
              Hashtbl.add node.children c new_node;
              new_node
          in
          insert_chars child_node rest
    in
    insert_chars root (List.of_seq (String.to_seq word))

  (* Search for a word in the trie. *)
  let search root word =
    let rec search_chars node chars =
      match chars with
      | [] -> node.is_end_of_word
      | c :: rest ->
          if Hashtbl.mem node.children c then
            search_chars (Hashtbl.find node.children c) rest
          else false
    in
    search_chars root (List.of_seq (String.to_seq word))

  let rec all_words_from_node node prefix acc =
    (* If the current node marks the end of the word,
       add the current prefix to the accumulator *)
    let acc = if node.is_end_of_word then prefix :: acc else acc in
    (* Iterate over all children of the current node *)
    Hashtbl.fold
      (* For each child node, recursively collect words *)
        (fun c child acc ->
        (* Constructs the new prefix by appending the character 'c'
              to the current prefix.
           Concatenate the current character to the prefix and
              recursive into the child node.
        *)
        all_words_from_node child (prefix ^ String.make 1 c) acc)
      node.children acc

  (* Retrieve all words in the trie *)
  let all_words root =
    let words = all_words_from_node root "" [] in
    List.sort String.compare words

  (* Find all words with a given prefix *)
  let words_with_prefix root prefix =
    let rec find_prefix_node node chars =
      match chars with
      | [] -> Some node
      | c :: rest ->
          if Hashtbl.mem node.children c then
            find_prefix_node (Hashtbl.find node.children c) rest
          else None
    in
    match find_prefix_node root (List.of_seq (String.to_seq prefix)) with
    | Some node ->
        let words = all_words_from_node node prefix [] in
        (* Sort words lexicographically *)
        List.sort String.compare words
    | None -> []

  (* Count the number of words with a given prefix *)
  let count_words_with_prefix root prefix =
    List.length (words_with_prefix root prefix)

  (* Delete a word from the trie *)
  let delete root word =
    let rec delete_chars node chars =
      match chars with
      | [] -> node.is_end_of_word <- false
      | c :: rest ->
          (* Check if the current character is present in the children of the
             current node *)
          if Hashtbl.mem node.children c then (
            (* Get the child node corresponding to the current character *)
            let child_node = Hashtbl.find node.children c in
            (* Recursively delete the remaining characters *)
            delete_chars child_node rest;
            (* Check if the child node is no longer needed *)
            if
              (* The child node is not an end of a word and has no other children *)
              (not child_node.is_end_of_word)
              && Hashtbl.length child_node.children = 0
            then
              (* Remove the child node from the parent node's children hashtable. *)
              Hashtbl.remove node.children c)
    in
    (* Convert the word to a list of characters and start the deletion process. *)
    delete_chars root (List.of_seq (String.to_seq word))
end
