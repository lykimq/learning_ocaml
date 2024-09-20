open Digestif

module UniqueIdentifier : sig
  val generate_uid : string -> string
  val verify_uid : string -> string -> bool
  val shorten_uid : string -> int -> string
  val is_valid_uid : string -> bool
  val combine_uids : string list -> string
  val generate_uid_from_multiple_fields : string list -> string
end = struct
  let generate_uid data =
    let hash = BLAKE2B.digest_string data in
    BLAKE2B.to_hex hash

  let verify_uid data uid =
    let generate_uid = generate_uid data in
    String.equal generate_uid uid

  (* Shorten a UID to the first [n] characters *)
  let shorten_uid uid n =
    if n <= 0 then ""
    else if n >= String.length uid then uid
    else String.sub uid 0 n

  (* Check if a string is a valid hexadecimal UID *)
  let is_valid_uid uid =
    let is_hex c = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') in
    String.length uid > 0 && String.for_all is_hex uid

  (* Generate a composite UID by combining multiple UIDs *)
  let combine_uids uids =
    let concat = String.concat "" uids in
    generate_uid concat

  (* Generate UID from multiple fields *)
  let generate_uid_from_multiple_fields fields =
    let concat = String.concat ":" fields in
    generate_uid concat
end
