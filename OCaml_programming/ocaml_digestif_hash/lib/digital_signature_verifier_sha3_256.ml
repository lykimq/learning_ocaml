module DigitalSignatureVerifier : sig
  (* Type definitions *)
  type document = string
  type signature = string
  type private_key = Mirage_crypto_ec.Ed25519.priv
  type public_key = Mirage_crypto_ec.Ed25519.pub

  val generate_keys : unit -> private_key * public_key
  val hash_document : document -> string
  val sign_document : private_key -> document -> string * signature
  val verify_signature : public_key -> document -> signature -> bool
end = struct
  type document = string
  type signature = string
  type private_key = Mirage_crypto_ec.Ed25519.priv
  type public_key = Mirage_crypto_ec.Ed25519.pub

  (* Simulate key generation *)
  let generate_keys () =
    let private_key, public_key = Mirage_crypto_ec.Ed25519.generate () in
    (private_key, public_key)

  let hash_document (doc : document) =
    Digestif.SHA3_256.(digest_string doc |> to_raw_string)

  (* Simulated signing function: sign a hash with a private key *)
  let sign_document private_key doc =
    let hash = hash_document doc in
    let signature = Mirage_crypto_ec.Ed25519.sign ~key:private_key hash in
    (hash, signature)

  (* Verify the signature by re-hashing the document and comparing *)
  let verify_signature public_key doc signature =
    let expected_hash = hash_document doc in
    Mirage_crypto_ec.Ed25519.verify ~key:public_key ~msg:expected_hash signature
end
