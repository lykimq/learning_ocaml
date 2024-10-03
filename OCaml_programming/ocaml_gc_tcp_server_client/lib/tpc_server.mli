module TCP_Server : sig
  val start_server :
    ?ip:string -> ?port:int -> unit -> Lwt_unix.file_descr Lwt.t

  val server_receive_messages : Lwt_unix.file_descr -> unit Lwt.t
  val stop_server : Lwt_unix.file_descr -> unit -> unit Lwt.t
  val get_active_connections : unit -> (Lwt_unix.file_descr * string) list
  val server_status : unit -> unit Lwt.t
end
