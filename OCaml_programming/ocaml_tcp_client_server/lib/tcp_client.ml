open Lwt.Infix

module TCP_Client : sig
  val connect_to_server : string -> int -> Lwt_unix.file_descr Lwt.t
  val send_message : Lwt_unix.file_descr -> string -> unit Lwt.t
  val receive_message : Lwt_unix.file_descr -> string Lwt.t
  val stop_client : Lwt_switch.t -> Unix.file_descr -> unit Lwt.t
  val start_client : string -> int -> Lwt_switch.t -> Lwt_unix.file_descr Lwt.t
end = struct
  let connect_to_server host port =
    let addr = Unix.ADDR_INET (Unix.inet_addr_of_string host, port) in
    let client_socket = Lwt_unix.socket PF_INET SOCK_STREAM 0 in
    Lwt_unix.connect client_socket addr >>= fun () ->
    Logs_lwt.info (fun m -> m "Client connected to server on port %d" port)
    >>= fun () -> Lwt.return client_socket

  (* TODO: client can sign the message? *)
  let send_message client_socket message =
    let oc = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    Lwt_io.write_line oc message >>= fun () ->
    Logs_lwt.info (fun m -> m "Message send: %s" message)

  (* TODO: verify the signature from server *)
  let receive_message client_socket =
    let ic = Lwt_io.of_fd ~mode:Lwt_io.input client_socket in
    Lwt_io.read_line_opt ic >>= function
    | Some message ->
        Logs_lwt.info (fun m -> m "Message received: %s" message) >>= fun () ->
        Lwt.return message
    | None -> Lwt.fail_with "No message received"

  let stop_client shutdown_flag client_socket =
    Logs_lwt.info (fun m -> m "Stopping client...") >>= fun () ->
    Lwt_switch.turn_off shutdown_flag >>= fun () ->
    Tcp_common.safe_close client_socket >>= fun () ->
    Logs_lwt.info (fun m -> m "Client stopped.")

  let start_client host port shutdown_flag =
    connect_to_server host port >>= fun client_socket ->
    let rec client_loop () =
      if Lwt_switch.is_on shutdown_flag then
        (* If the shutdown flag is turned on, stop the loop *)
        Logs_lwt.info (fun m -> m "Client shutdown initiated; exiting loop.")
      else
        Lwt.catch
          (fun () ->
            (* Try to receive a message from the server *)
            receive_message client_socket >>= fun message ->
            Logs_lwt.info (fun m -> m "Received message: %s" message)
            >>= fun () ->
            (* Send a reply to the server *)
            send_message client_socket ("Reply: " ^ message) >>= fun () ->
            (* Continue the loop unless the shutdown flag is on *)
            client_loop ())
          (function
            | Unix.Unix_error (Unix.EBADF, _, _) ->
                Logs_lwt.err (fun m ->
                    m "Socket closed or invalid; exiting loop.")
                >>= fun () ->
                Lwt.return_unit (* Exit loop when socket is closed *)
            | exn ->
                Logs_lwt.err (fun m ->
                    m "Error in client loop: %s" (Printexc.to_string exn))
                >>= fun () -> Lwt.return_unit (* Exit loop on error *))
    in
    (* Run the client loop asynchronously *)
    Lwt.async (fun () -> client_loop ());

    (* Hook the shutdown flag to stop the client gracefully *)
    (*Lwt_switch.add_hook (Some shutdown_flag) (fun () ->
        Logs_lwt.info (fun m -> m "Shutting down client...") >>= fun () ->
        stop_client shutdown_flag (Lwt_unix.unix_file_descr client_socket));*)
    Logs_lwt.info (fun m -> m "Client started.") >>= fun () ->
    Lwt.return client_socket
end
