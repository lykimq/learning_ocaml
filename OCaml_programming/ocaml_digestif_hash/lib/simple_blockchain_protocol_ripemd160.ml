open Digestif

(* Define a type for a block in a blockchain *)
type block = {
  index : int; (* The position of the block in the chain *)
  previous_hash : string; (* The hash of the previous block *)
  data : string; (* Data stored in the block, could be any information *)
  timestamp : float; (* Timestamp of block creation *)
  hash : string; (* Hash of the current block *)
}

module Blockchain : sig
  val calculate_hash : int -> string -> string -> float -> string
  val create_genesis_block : unit -> block
  val add_block : block -> string -> block
  val verify_chain : block list -> bool
end = struct
  (* Hashes the contents of a block using RIPMD160 *)
  let calculate_hash index previous_hash data timestamp =
    let input = Printf.sprintf "%d%s%s%f" index previous_hash data timestamp in
    let hash = RMD160.digest_string input in
    RMD160.to_hex hash

  (* Create the genesis block, which is the first block of the blockchain *)
  let create_genesis_block () =
    let index = 0 in
    let previous_hash = "0" in
    let data = "Genesis Block" in
    let timestamp = Unix.time () in
    let hash = calculate_hash index previous_hash data timestamp in
    { index; previous_hash; data; timestamp; hash }

  (* Add a new block to the chain, creating a hash based on the previous block *)
  let add_block previous_block data =
    let index = previous_block.index + 1 in
    (* Use the hash of the previous block *)
    let previous_hash = previous_block.hash in
    let timestamp = Unix.time () in
    let hash = calculate_hash index previous_hash data timestamp in
    { index; previous_hash; data; timestamp; hash }

  (* Verify the integrity of the blockchain by checking if each block's hash
     matches the next block's previous hash *)
  let rec verify_chain = function
    | [] | [ _ ] ->
        true (* An empty chain or a single-block chain is always valid *)
    | prev_block :: (current_block :: _ as rest) ->
        (* Ensure the previous block's stored hash is consistent *)
        let recalculated_prev_hash =
          calculate_hash prev_block.index prev_block.previous_hash
            prev_block.data prev_block.timestamp
        in
        let is_prev_block_hash_valid =
          String.equal prev_block.hash recalculated_prev_hash
        in

        (* Ensure the current block's previous_hash matches the previous block's hash *)
        let is_previous_hash_valid =
          String.equal current_block.previous_hash prev_block.hash
        in

        (* Debugging information for each block *)
        Printf.printf
          "Validating Block #%d -> Previous Hash: %b, Current Block Valid: %b\n"
          current_block.index is_previous_hash_valid is_prev_block_hash_valid;

        (* If either the hash check or the previous hash linking check fails, the chain is invalid *)
        if not (is_prev_block_hash_valid && is_previous_hash_valid) then false
        else verify_chain rest
end
