module TCP_Server : sig
  val server_connect :
    ?ip:string -> ?port:int -> unit -> Lwt_unix.file_descr Lwt.t

  val server_receive_messages : Lwt_unix.file_descr -> unit Lwt.t
  val server_disconnect : Lwt_unix.file_descr -> unit Lwt.t
  val get_active_connections : unit -> (Lwt_unix.file_descr * string) list
  val server_status : unit -> unit Lwt.t
end
