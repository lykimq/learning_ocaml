module type HashFunction = sig
  val digest_string : string -> string
end

module Digital_signature_common = struct
  type document = string
  type signature = string
  type private_key = Mirage_crypto_ec.Ed25519.priv
  type public_key = Mirage_crypto_ec.Ed25519.pub

  (* Generate Ed25519 key pair (privatre and public key) *)
  let generate_keys () =
    let private_key, public_key = Mirage_crypto_ec.Ed25519.generate () in
    (private_key, public_key)

  (* Sign the document using the given hash function *)
  let sign_document (module Hash : HashFunction) private_key doc =
    let hash = Hash.digest_string doc in
    let signature = Mirage_crypto_ec.Ed25519.sign ~key:private_key hash in
    (hash, signature)

  let verify_signature (module Hash : HashFunction) public_key doc signature =
    let expected_hash = Hash.digest_string doc in
    Mirage_crypto_ec.Ed25519.verify ~key:public_key ~msg:expected_hash signature
end
