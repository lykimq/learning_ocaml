open Yojson.Safe
open Ocaml_digestif_hash.Digital_signature_common

module Message : sig
  type msg_type =
    | Request
    | Response
    | Critical
    | Info
    | Warning
    | Debug
    | Error

  type message = {
    msg_type : msg_type;
    payload : string;
    timestamp : string;
    hash : string;
    signature : string option;
  }

  module Blak2b : HashFunction

  val string_of_msg_type : msg_type -> string
  val string_to_msg_type : string -> msg_type
  val encode_message : message -> string
  val decode_message : string -> message
  val hash_message : (module HashFunction) -> message -> string

  val sign_message :
    (module HashFunction) -> Mirage_crypto_ec.Ed25519.priv -> message -> message

  val verify_signature :
    (module HashFunction) -> Mirage_crypto_ec.Ed25519.pub -> message -> bool
end = struct
  type msg_type =
    | Request
    | Response
    | Critical
    | Info
    | Warning
    | Debug
    | Error

  type message = {
    msg_type : msg_type;
    payload : string;
    timestamp : string;
    hash : string;
    signature : string option;
  }

  let string_of_msg_type msg =
    match msg with
    | Request -> "Request"
    | Response -> "Response"
    | Critical -> "Critical"
    | Info -> "Info"
    | Warning -> "Warning"
    | Debug -> "Debug"
    | Error -> "Error"

  let string_to_msg_type msg_str =
    match msg_str with
    | "Request" -> Request
    | "Response" -> Response
    | "Critical" -> Critical
    | "Info" -> Info
    | "Warning" -> Warning
    | "Debug" -> Debug
    | "Error" -> Error
    | _ -> raise (Errors.MessageError ("Invalid message type: " ^ msg_str))

  (* Convert message to JSON and encode to Base64 for transmission *)
  let encode_message msg =
    try
      let msg_type_str = string_of_msg_type msg.msg_type in
      let json =
        `Assoc
          [
            ("type", `String msg_type_str);
            ("payload", `String msg.payload);
            ("timestamp", `String msg.timestamp);
            ("hash", `String msg.hash);
            ("signature", `String (Option.value msg.signature ~default:""));
          ]
      in
      let json_str = to_string json in
      Base64.encode_string json_str
    with
    | Yojson.Json_error err ->
        raise (Errors.MessageError ("JSON encoding error: " ^ err))
    | exn ->
        raise
          (Errors.MessageError
             ("Unexpected error during message encoding: "
            ^ Printexc.to_string exn))

  (* Decode a Base64 encoded message and convert it back to OCaml message type *)

  let decode_message encoded_msg =
    try
      let decoded_str = Base64.decode_exn encoded_msg in
      let json = from_string decoded_str in
      match json with
      | `Assoc fields ->
          let msg_type_str =
            Yojson.Safe.Util.to_string (List.assoc "type" fields)
          in
          let msg_type = string_to_msg_type msg_type_str in
          let payload = Util.to_string (List.assoc "payload" fields) in
          let timestamp = Util.to_string (List.assoc "timestamp" fields) in
          let hash = Util.to_string (List.assoc "hash" fields) in
          let signature =
            Util.to_string_option (List.assoc "signature" fields)
          in
          { msg_type; payload; timestamp; hash; signature }
      | _ -> raise (Errors.MessageError "Invalid message format")
    with
    | Yojson.Json_error msg ->
        raise (Errors.MessageError ("JSON decoding error: " ^ msg))
    | exn ->
        raise
          (Errors.MessageError
             ("Unknown error during message decoding: " ^ Printexc.to_string exn))

  (* Hash the message using Blake2b for integrity *)
  module Blak2b : HashFunction = struct
    let digest_string s = Digestif.BLAKE2B.(digest_string s |> to_raw_string)
  end

  let hash_message (module Hash : HashFunction) msg =
    let msg_type_str = string_of_msg_type msg.msg_type in
    let data_to_hash = msg_type_str ^ msg.payload ^ msg.timestamp in
    (* Use Blake2b hashing function from DigitalSignatureCommon *)
    Hash.digest_string data_to_hash

  let sign_message (module Hash : HashFunction) private_key msg =
    try
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
    with _ -> raise (Errors.MessageError "Failed to sign the message")

  let verify_signature (module Hash : HashFunction) public_key msg =
    match msg.signature with
    | None -> false (* If there is no signature, verification fails *)
    | Some signature ->
        (* Hash the message payload using the same hash function *)
        let hash = hash_message (module Hash) msg in
        (* Verify the signature using the public key and the hashed payload *)
        if
          Digital_signature_common.verify_signature
            (module Hash)
            public_key hash signature
        then true
        else raise (Errors.MessageError "Signature verification failed")
end
