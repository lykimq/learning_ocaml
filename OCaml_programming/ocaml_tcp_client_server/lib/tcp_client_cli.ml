open Lwt.Infix
open Tcp_cli_common
open Ocaml_tcp_client_server

(* Store the client socket and shutdown flag to be reused for stopping *)
let client_socket_ref = ref None
let shutdown_flag_ref = ref None

let start_client args =
  let ip, port = get_ip_port args in
  let shutdown_flag = Lwt_switch.create () in
  shutdown_flag_ref := Some shutdown_flag;

  Logs_lwt.info (fun m -> m "Starting TCP client to connect to %s:%d" ip port)
  >>= fun () ->
  Tcp_client.TCP_Client.start_client ip port shutdown_flag
  >>= fun client_socket ->
  client_socket_ref := Some client_socket;
  Logs_lwt.info (fun m -> m "Client started. Press Ctrl+C to stop.")

let stop_client () =
  match (!client_socket_ref, !shutdown_flag_ref) with
  | Some client_socket, Some shutdown_flag ->
      Logs_lwt.info (fun m -> m "Stopping client...") >>= fun () ->
      Tcp_client.TCP_Client.stop_client shutdown_flag
        (Lwt_unix.unix_file_descr client_socket)
      >>= fun () -> Logs_lwt.info (fun m -> m "Client stopped.")
  | _ -> Logs_lwt.err (fun m -> m "No running client to stop.")

let send_message args =
  if Array.length args < 4 then
    Lwt_io.printl "Usage: ./tcp_client send <message_type> <message>"
    >>= fun () -> Lwt.fail_with "Invalid arguments"
  else
    let message_type = args.(2) in
    let message = args.(3) in
    match !client_socket_ref with
    | Some client_socket ->
        Logs_lwt.info (fun m ->
            m "Sending message of type: %s with content: %s" message_type
              message)
        >>= fun () -> Tcp_client.TCP_Client.send_message client_socket message
    | None -> Logs_lwt.err (fun m -> m "Client not running.")

let run () =
  let valid_commands = [ "start"; "send"; "stop" ] in
  Lwt_main.run
    ( parse_args "client" valid_commands >>= fun (command, args) ->
      match command with
      | "start" -> start_client args
      | "send" -> send_message args
      | "stop" -> stop_client ()
      | _ -> print_usage "client" )

let () = run ()
