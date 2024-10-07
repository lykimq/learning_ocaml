open Ocaml_digestif_hash.Digital_signature_common

module Message : sig
  type msg_type =
    | Request
    (* A message requesting an action or data, typically sent form a client to a
       server. Example: HTTP GET or POST request.
    *)
    | Response
    (* A message sent in response to a request, containing the result of the
       result of the requested action or data. Example: HTTP 200 OK response or
       an error message in reponse to a request.
    *)
    | Critical
    (* A high-priority message indicating an urgent or critical situation
       request immediate action. Example: System alerts or notifications about
       security breaches or critical systems failure. *)
    | Info
    (* An information message that does not require immdiate action, often used
       for status updates, logs, or notifications. Example: Regular system logs
       or status reports on successful operations. *)
    | Warning
    (* A message that indicates a potential problem or situation that may
       require attention but is not immediately critical. Example: Low disk
       space warning or high memory usage alert. *)
    | Debug
    (* A message used for debugging purposes, providing detailed information
       about the system's internal state. *)
    | Error
  (* A message indicating that an error has occurred, typically including
     details about the failure. Example: HTTP 500 Internal Server Error or a
     custom error message explaining when went wrong. *)

  type message = {
    msg_type : msg_type;
    payload : string; (* The actual message content *)
    timestamp : string; (* Timestamp when the message was created *)
    hash : string; (* Hash of the message contents *)
    signature : string option; (* Optional digital signature for authenticity *)
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
end
