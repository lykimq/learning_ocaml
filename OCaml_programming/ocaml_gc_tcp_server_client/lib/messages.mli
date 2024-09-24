open Ocaml_digestif_hash.Digital_signature_common

module Message : sig
  type message = {
    msg_type : string; (* "Request" or "Respond" *)
    payload : string; (* The actual message content *)
    timestamp : string; (* Timestamp when the message was created *)
    hash : string; (* Hash of the message contents *)
    signature : string option; (* Optional digital signature for authenticity *)
  }

  val encode_message : message -> string
  val decode_message : string -> message
  val hash_message : (module HashFunction) -> message -> string

  val sign_message :
    (module HashFunction) -> Mirage_crypto_ec.Ed25519.priv -> message -> message

  val verify_signature :
    (module HashFunction) -> Mirage_crypto_ec.Ed25519.pub -> message -> bool
end
