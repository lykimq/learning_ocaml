open Digestif

(* Module to handle password hashing and verification using the Digestif *)
module PasswordStorage : sig
  val hash_password : string -> string
  val verify_password : string -> string -> bool
end = struct
  let hash_password password =
    let hash = SHA256.digest_string password in
    SHA256.to_hex hash

  let verify_password password hashed_password =
    let hash_attempt = hash_password password in
    String.equal hash_attempt hashed_password
end
