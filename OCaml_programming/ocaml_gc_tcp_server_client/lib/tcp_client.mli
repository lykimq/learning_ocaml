module TCP_Client : sig
  val client_connect : ip:string -> port:int -> unit -> unit Lwt.t
  val client_disconnect : unit -> unit Lwt.t

  val client_send_message :
    msg_type:Messages.Message.msg_type -> string -> unit Lwt.t

  val client_status : unit -> unit Lwt.t
end
