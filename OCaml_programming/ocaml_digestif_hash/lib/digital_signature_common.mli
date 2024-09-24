module type HashFunction = sig
  val digest_string : string -> string
end

module Digital_signature_common : sig
  (* Type Definition *)
  type document = string
  type signature = string
  type private_key = Mirage_crypto_ec.Ed25519.priv
  type public_key = Mirage_crypto_ec.Ed25519.pub

  val generate_keys : unit -> private_key * public_key

  (* Use a specific hash function module for signing *)
  val sign_document :
    (module HashFunction) -> private_key -> document -> string * signature

  (* Use a specific hash function module for verification *)
  val verify_signature :
    (module HashFunction) -> public_key -> document -> signature -> bool
end
