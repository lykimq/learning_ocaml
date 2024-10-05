open Lwt.Infix

module TCP_Server : sig
  val buffer_size : int

  val create_server :
    Unix.file_descr -> bytes -> Lwt_switch.t -> unit -> unit Lwt.t

  val create_socket : int -> Unix.file_descr Lwt.t
  val start_server : int -> Lwt_switch.t -> Unix.file_descr Lwt.t
  val stop_server : Lwt_switch.t -> Unix.file_descr -> unit Lwt.t
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
    (* Convert Lwt_unix.file_descr to Unix.file_descr *)
    Lwt.return (Lwt_unix.unix_file_descr server_socket)

  let create_server server_socket buffer shutdown_flag =
    let rec serve () =
      Lwt_unix.accept
        (Lwt_unix.of_unix_file_descr ~blocking:false server_socket)
      >>= fun conn ->
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

  (* [safe_close: Unix.file_descr -> unit Lwt.t]

      This function provides a safe way to shut down and close a socket file
      descriptor.

      It serves as a workaround to avoid using `Lwt_unix.close` directly, as
      calling it often raises errors such as `Unix.EBADF` (Bad File Descriptor)
      during  socket closure, especially when the socket might already be in an
      invalid state or prematurely closed elsewhere in the system.

      Instead of relying on `Lwt_unix.close`, this function manually shuts down
      the socket using `Unix.shutdown` to ensure that no further reads or write
      are allowed on the socket. It then calls `Unix.close` to close the socket,
      while catching and handling potential errors like `Unix.ENOTCONN` (Not
      Connected) and `Unix.EBADF`.

      The function performs the following steps:
      1. Logs the intent to shut down the socket.
      2. Shuts down the socket for both reads and writes using `Unix.shutdown`.
      3. If the socket is already closed or not connected, logs the information
         and safely continues.
      4. After shutdown, attempts to close the socket using `Unix.close`.
      5. Logs any errors that occur during the shutdown or close process, and
         handles common errors like `Unix.EBADF` and `Unix.ENOTCONN`

     This approach ensures that the socket is properly cleaned up without causing
     unexpected exceptions or crashes due to invalid file descriptors.
  *)
  let safe_close socket_fd =
    (* Check if the socket file descriptor is valid *)
    Lwt.catch
      (fun () ->
        (* First, shutdown the socket for both reads and writes *)
        Logs_lwt.info (fun m -> m "Shutting down the socket...") >>= fun () ->
        Lwt.catch
          (fun () ->
            Unix.shutdown socket_fd Unix.SHUTDOWN_ALL;
            Logs_lwt.info (fun m -> m "Socket shutdown complete.") >>= fun () ->
            Lwt.return_unit)
          (function
            | Unix.Unix_error (Unix.ENOTCONN, _, _) ->
                Logs_lwt.info (fun m ->
                    m "Socket was not connected; continuing.")
                >>= fun () -> Lwt.return_unit
            | Unix.Unix_error (Unix.EBADF, _, _) ->
                Logs_lwt.info (fun m ->
                    m "Socket already closed or invalid during shutdown")
                >>= fun () -> Lwt.return_unit
            | exn ->
                Logs_lwt.err (fun m ->
                    m "Error during socket shutdown: %s"
                      (Printexc.to_string exn)))
        >>= fun () ->
        (* After shutdown, manually close the socket using Unix.close *)
        Logs_lwt.info (fun m -> m "Closing the socket...") >>= fun () ->
        try
          Unix.close socket_fd;
          Logs_lwt.info (fun m -> m "Socket closed successfully.") >>= fun () ->
          Lwt.return_unit
        with
        | Unix.Unix_error (Unix.EBADF, _, _) ->
            Logs_lwt.info (fun m ->
                m "Socket already closed or invalid during close.")
            >>= fun () -> Lwt.return_unit
        | exn ->
            Logs_lwt.err (fun m ->
                m "Error during socket close: %s" (Printexc.to_string exn))
            >>= fun () -> Lwt.fail exn)
      (function
        | Unix.Unix_error (Unix.EBADF, _, _) ->
            Logs_lwt.info (fun m -> m "Socket was already closed.")
            >>= fun () -> Lwt.return_unit
        | exn ->
            Logs_lwt.err (fun m ->
                m "Unexpected error: %s" (Printexc.to_string exn))
            >>= fun () -> Lwt.fail exn)

  let stop_server shutdown_flag server_socket =
    Logs_lwt.info (fun m -> m "Stopping the server...") >>= fun () ->
    Lwt_switch.turn_off shutdown_flag >>= fun () ->
    safe_close server_socket >>= fun () ->
    Logs_lwt.info (fun m -> m "Server stopped.")
end
