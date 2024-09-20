module UniqueIdentifier : sig
  val generate_uid : string -> string
  val verify_uid : string -> string -> bool
  val shorten_uid : string -> int -> string
  val is_valid_uid : string -> bool
  val combine_uids : string list -> string
  val generate_uid_from_multiple_fields : string list -> string
end
