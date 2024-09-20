module UniqueIdentifier : sig
  val generate_uid : string -> string
  val verify_uid : string -> string -> bool
end
