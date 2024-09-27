module TCP_Server : sig
  val max_clients : int
  val connected_clients : int ref
  val shutdown_flag : bool ref
  val client_sockets : (Lwt_unix.file_descr * Unix.sockaddr) list ref
  val server_start : unit -> Lwt_unix.file_descr Lwt.t
  val stop_server : Lwt_unix.file_descr -> unit Lwt.t
  val status_server : unit -> unit Lwt.t
  val get_active_connections : unit -> (Lwt_unix.file_descr * string) list
end
