open Yojson.Safe
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
end = struct
  (* Define the message type *)
  type message = {
    msg_type : string; (* "Request" or "Respond" *)
    payload : string; (* The actual message content *)
    timestamp : string; (* Timestamp when the message was created *)
    hash : string; (* Hash of the message contents *)
    signature : string option; (* Optional digital signature for authenticity *)
  }

  (* Convert message to JSON and encode to Base64 for transmission *)
  let encode_message msg =
    let json =
      `Assoc
        [
          ("type", `String msg.msg_type);
          ("payload", `String msg.payload);
          ("timestamp", `String msg.timestamp);
          ("hash", `String msg.hash);
          ("signature", `String (Option.value msg.signature ~default:""));
        ]
    in
    let json_str = to_string json in
    Base64.encode_string json_str

  (* Decode a Base64 encoded message and convert it back to OCaml message type *)

  let decode_message encoded_msg =
    let decoded_str = Base64.decode_exn encoded_msg in
    let json = from_string decoded_str in
    match json with
    | `Assoc fields ->
        let msg_type = Util.to_string (List.assoc "type" fields) in
        let payload = Util.to_string (List.assoc "payload" fields) in
        let timestamp = Util.to_string (List.assoc "timestamp" fields) in
        let hash = Util.to_string (List.assoc "hash" fields) in
        let signature = Util.to_string_option (List.assoc "signature" fields) in
        { msg_type; payload; timestamp; hash; signature }
    | _ -> failwith "Invalid message format"

  (* Hash the message using Blake2b for integrity *)
  module Blak2b : HashFunction = struct
    let digest_string s = Digestif.BLAKE2B.(digest_string s |> to_raw_string)
  end

  let hash_message (module Hash : HashFunction) msg =
    let data_to_hash = msg.msg_type ^ msg.payload ^ msg.timestamp in
    (* Use Blake2b hashing function from DigitalSignatureCommon *)
    Hash.digest_string data_to_hash

  let sign_message (module Hash : HashFunction) private_key msg =
    (* First, hash the message using the specific hash function *)
    let hash = hash_message (module Hash) msg in
    (* Now sign the document (payload) using the hash function and private key *)
    let _, signature =
      Digital_signature_common.sign_document
        (module Hash)
        private_key msg.payload
    in
    (* Return the message with updated hash and signature *)
    { msg with hash; signature = Some signature }

  let verify_signature (module Hash : HashFunction) public_key msg =
    match msg.signature with
    | None -> false (* If there is no signature, verification fails *)
    | Some signature ->
        (* Hash the message payload using the same hash function *)
        let hash = hash_message (module Hash) msg in
        (* Verify the signature using the public key and the hashed payload *)
        Digital_signature_common.verify_signature
          (module Hash)
          public_key hash signature
end
