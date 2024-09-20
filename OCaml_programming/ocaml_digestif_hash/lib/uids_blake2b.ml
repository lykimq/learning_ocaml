open Digestif

module UniqueIdentifier : sig
  val generate_uid : string -> string
  val verify_uid : string -> string -> bool
end = struct
  let generate_uid data =
    let hash = BLAKE2B.digest_string data in
    BLAKE2B.to_hex hash

  let verify_uid data uid =
    let generate_uid = generate_uid data in
    String.equal generate_uid uid
end
