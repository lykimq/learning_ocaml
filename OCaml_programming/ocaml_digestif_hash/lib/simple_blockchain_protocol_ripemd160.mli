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
end
