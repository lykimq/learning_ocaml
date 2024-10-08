module TCP_Client : sig
  val connect_to_server : string -> int -> Lwt_unix.file_descr Lwt.t
  val send_message : Lwt_unix.file_descr -> string -> unit Lwt.t
  val receive_message : Lwt_unix.file_descr -> string Lwt.t
  val stop_client : Lwt_switch.t -> Unix.file_descr -> unit Lwt.t
  val start_client : string -> int -> Lwt_switch.t -> Lwt_unix.file_descr Lwt.t
end
