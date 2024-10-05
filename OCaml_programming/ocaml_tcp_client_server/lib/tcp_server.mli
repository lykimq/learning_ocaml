module TCP_Server : sig
  val buffer_size : int

  val create_server :
    Unix.file_descr -> bytes -> Lwt_switch.t -> unit -> unit Lwt.t

  val create_socket : int -> Unix.file_descr Lwt.t
  val start_server : int -> Lwt_switch.t -> Unix.file_descr Lwt.t
  val stop_server : Lwt_switch.t -> Unix.file_descr -> unit Lwt.t
end
