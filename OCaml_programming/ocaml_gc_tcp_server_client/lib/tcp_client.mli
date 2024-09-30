module TCP_Client : sig
  val client_connect : ip:string -> port:int -> unit Lwt.t
  val client_disconnect : unit -> unit Lwt.t
  val client_send_message : string -> unit Lwt.t
  val client_status : unit -> unit Lwt.t
end
