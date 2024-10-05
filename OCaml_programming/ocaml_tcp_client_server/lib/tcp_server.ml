open Lwt.Infix

module TCP_Server : sig
  val buffer_size : int

  val create_server :
    Lwt_unix.file_descr -> bytes -> Lwt_switch.t -> unit -> unit Lwt.t

  val create_socket : int -> Lwt_unix.file_descr Lwt.t
  val start_server : int -> Lwt_switch.t -> Lwt_unix.file_descr Lwt.t
  val stop_server : Lwt_switch.t -> Lwt_unix.file_descr -> unit Lwt.t
end = struct
  let max_clients = 10
  let buffer_size = 1024

  let next_connection_id =
    let counter = ref 0 in
    fun () ->
      incr counter;
      !counter

  let rec handle_connection ic oc connection_id () =
    let buffer = Bytes.create buffer_size in
    Lwt_io.read_into ic buffer 0 buffer_size >>= fun bytes_read ->
    if bytes_read = 0 then Lwt_io.close oc
    else
      let incoming_msg = Bytes.sub_string buffer 0 bytes_read in
      Logs_lwt.info (fun m ->
          m "[connection: %i] Received message: %s" connection_id incoming_msg)
      >>= fun () ->
      Lwt_io.write_line oc incoming_msg
      >>= handle_connection ic oc connection_id

  let transfer_messages buffer oc connection_id =
    let rec transfer () =
      match Lwt_io.is_closed oc with
      | true ->
          Logs_lwt.debug (fun m ->
              m "[connection: %i] Output channel closed, ignoring message"
                connection_id)
      | false ->
          if Bytes.length buffer > 0 then
            let message = Bytes.to_string buffer in
            Lwt_io.write_line oc message >>= fun () ->
            Logs_lwt.info (fun m ->
                m "[connection: %i] >> %s" connection_id message)
            >>= fun () -> transfer ()
          else Logs_lwt.info (fun m -> m "Stream ended unexpected.")
    in
    Lwt.catch
      (fun () -> transfer ())
      (fun exn ->
        Logs_lwt.debug (fun m ->
            m "[connection: %i] Cannot transfer message to connection: %s"
              connection_id (Printexc.to_string exn)))

  let accept_connection buffer conn =
    let connection_id = next_connection_id () in
    let fd, _ = conn in
    let ic = Lwt_io.of_fd ~mode:Lwt_io.input fd in
    let oc = Lwt_io.of_fd ~mode:Lwt_io.output fd in
    Lwt.on_failure (handle_connection ic oc connection_id ()) (fun exn ->
        Lwt_io.printf "%s" (Printexc.to_string exn) |> ignore);
    Lwt.async (fun () -> transfer_messages buffer oc connection_id);
    Logs_lwt.info (fun m ->
        m "[connection: %i] New connection established" connection_id)
    >>= Lwt.return

  let create_socket port =
    let socket_addr = Lwt_unix.ADDR_INET (Unix.inet_addr_any, port) in
    let server_socket = Lwt_unix.socket PF_INET SOCK_STREAM 0 in
    Lwt_unix.bind server_socket socket_addr >>= fun () ->
    Lwt_unix.listen server_socket max_clients;
    Lwt.return server_socket

  let create_server server_socket buffer shutdown_flag =
    let rec serve () =
      Lwt_unix.accept server_socket >>= fun conn ->
      if Lwt_switch.is_on shutdown_flag then
        accept_connection buffer conn >>= serve
      else Lwt.return_unit
    in
    serve

  let start_server port shutdown_flag =
    Sys.set_signal Sys.sigpipe Sys.Signal_ignore;
    let buffer = Bytes.create buffer_size in
    create_socket port >>= fun server_socket ->
    Lwt.async (fun () -> create_server server_socket buffer shutdown_flag ());
    Logs_lwt.info (fun m -> m "Server started") >>= fun () ->
    Lwt.return server_socket

  let shutdown_and_close_socket server_socket =
    Lwt.catch
      (fun () ->
        Logs_lwt.info (fun m -> m "Shutting down the server socket...")
        >>= fun () ->
        let () = Lwt_unix.shutdown server_socket Unix.SHUTDOWN_ALL in
        Logs_lwt.info (fun m -> m "Server socket closed.") >>= fun () ->
        Lwt.return_unit)
      (function
        | Unix.Unix_error (Unix.EBADF, _, _) ->
            Logs_lwt.info (fun m -> m "Socket was already closed.")
            >>= fun () -> Lwt.return_unit
        | exn -> Lwt.fail exn)

  let stop_server shutdown_flag server_socket =
    Logs_lwt.info (fun m -> m "Stopping the server...") >>= fun () ->
    Lwt_switch.turn_off shutdown_flag >>= fun () ->
    shutdown_and_close_socket server_socket >>= fun () ->
    Logs_lwt.info (fun m -> m "Server stopped.")
end
