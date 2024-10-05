module TCP_Server : sig
  val buffer_size : int
  val create_server : Lwt_unix.file_descr -> bytes -> unit -> 'a Lwt.t
  val create_socket : int -> Lwt_unix.file_descr Lwt.t
  val start_server : int -> 'a Lwt.t
end
