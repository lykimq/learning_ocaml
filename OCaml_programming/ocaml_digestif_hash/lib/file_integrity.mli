open Digestif

module FileIntegrityChecker : sig
  val sha256_hash_file : string -> SHA256.t
  val hash_to_hex : SHA256.t -> string
  val save_hash : SHA256.t -> string -> unit
  val read_stored_hash : string -> string
  val verify_file_integrity : string -> string -> bool
end
