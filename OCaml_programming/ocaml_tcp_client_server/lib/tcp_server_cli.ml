open Lwt.Infix
open Tcp_cli_common
open Ocaml_tcp_client_server

(* Store the server socket and shutdown flag to be reused for stopping *)
let server_socket_ref = ref None
let shutdown_flag_ref = ref None

let start_server args =
  let ip, port = get_ip_port args in
  let shutdown_flag = Lwt_switch.create () in
  shutdown_flag_ref := Some shutdown_flag;
  Logs_lwt.info (fun m -> m "Starting TCP server on %s:%d" ip port)
  >>= fun () ->
  Tcp_server.TCP_Server.start_server port shutdown_flag >>= fun server_socket ->
  server_socket_ref := Some server_socket;
  Logs_lwt.info (fun m -> m "Server started. Press Ctrl+C to stop.")

let stop_server () =
  match (!server_socket_ref, !shutdown_flag_ref) with
  | Some server_socket, Some shutdown_flag ->
      Logs_lwt.info (fun m -> m "Stopping server...") >>= fun () ->
      Tcp_server.TCP_Server.stop_server shutdown_flag server_socket
      >>= fun () -> Logs_lwt.info (fun m -> m "Server stopped.")
  | _ -> Logs_lwt.err (fun m -> m "No running server to stop.")

let run () =
  let valid_commands = [ "start"; "stop" ] in
  parse_args "server" valid_commands >>= fun (command, args) ->
  match command with
  | "start" -> start_server args
  | "stop" -> stop_server ()
  | _ -> print_usage "server"

let () = Lwt_main.run (run ())
