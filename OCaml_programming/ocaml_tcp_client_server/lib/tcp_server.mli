module TCP_Server : sig
  val buffer_size : int

  val create_server :
    Lwt_unix.file_descr -> bytes -> Lwt_switch.t -> unit -> unit Lwt.t

  val create_socket : int -> Lwt_unix.file_descr Lwt.t
  val start_server : int -> Lwt_switch.t -> Lwt_unix.file_descr Lwt.t
  val stop_server : Lwt_switch.t -> Lwt_unix.file_descr -> unit Lwt.t
end
