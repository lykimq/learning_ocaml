open Ocaml_digestif_hash.Digital_signature_common

module TCP_Server : sig
  val max_clients : int
  val server_private_key : Digital_signature_common.private_key
  val server_public_key : Digital_signature_common.public_key
  val create_server : Unix.file_descr -> Lwt_switch.t -> unit -> unit Lwt.t
  val create_socket : string -> int -> Unix.file_descr Lwt.t

  val start_server :
    ?ip:string -> ?port:int -> Lwt_switch.t -> Unix.file_descr Lwt.t

  val stop_server : Lwt_switch.t -> Unix.file_descr -> unit Lwt.t
end
