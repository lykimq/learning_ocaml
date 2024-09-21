module DigitalSignatureVerifier : sig
  (* Type definitions *)
  type document = string
  type signature = Cstruct.t
  type private_key = Mirage_crypto_ec.Ed25519.priv
  type public_key = Mirage_crypto_ec.Ed25519.pub

  val generate_keys : unit -> private_key * public_key
  val hash_document : document -> signature
  val sign_document : private_key -> document -> signature * document
  val verify_signature : public_key -> document -> signature -> bool
end
