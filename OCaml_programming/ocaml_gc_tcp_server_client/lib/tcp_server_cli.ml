open Lwt.Infix
open Ocaml_gc_tcp_server_client

(* Variable to store the running server socket, if started *)
let server_socket = ref None

(* Function to start the server *)
let start_server () =
  match !server_socket with
  | Some _ -> Lwt_io.printf "Server is already running.\n"
  | None ->
      (* Start the TCP server using the [server_start] function *)
      Tcp_cli_utils.parse_args "server" [ "start" ] >>= fun (_, args) ->
      let ip, port = Tcp_cli_utils.get_ip_port args in
      Lwt_io.printf "Starting the server on %s:%d...\n" ip port >>= fun () ->
      let socket = Tcp_server.TCP_Server.start_server ~ip ~port () in
      server_socket := Some socket;
      Lwt_io.printf "Server started on %s:%d.\n" ip port

(* Function to stop the server *)
let stop_server () =
  match !server_socket with
  | None -> Lwt_io.printf "Server is not running.\n"
  | Some socket_promise ->
      Lwt_io.printf "Stopping the server...\n" >>= fun () ->
      (* Unwrapping the Lwt promise to get the actual socket *)
      socket_promise >>= fun socket ->
      Tcp_server.TCP_Server.stop_server socket () >>= fun () ->
      server_socket := None;
      Lwt_io.printf "Server stopped.\n"

(* Function to view active connections *)
let view_connections () =
  match !server_socket with
  | None -> Lwt_io.printf "Server is not running.\n"
  | Some _ ->
      let connections = Tcp_server.TCP_Server.get_active_connections () in
      let client_count = List.length connections in
      Lwt_io.printf "Active connections: %d\n" client_count >>= fun () ->
      if client_count > 0 then
        Lwt_list.iter_p
          (fun (_, client_addr) ->
            Lwt_io.printf "Client connected from: %s\n" client_addr)
          connections
      else Lwt_io.printf "No active connections.\n"

(* Function to check server status *)
let status_check () =
  match !server_socket with
  | None -> Lwt_io.printf "Server is not running.\n"
  | Some _ ->
      Tcp_server.TCP_Server.server_status () >>= fun () ->
      Lwt_io.printf "Server status checked.\n"

let main () =
  Tcp_cli_utils.parse_args "server" [ "start"; "stop"; "status"; "connections" ]
  >>= fun (command, _) ->
  match command with
  | "start" -> start_server ()
  | "connections" -> view_connections ()
  | "stop" -> stop_server ()
  | "status" -> status_check ()
  | _ -> failwith "Unknown command\n"

let () =
  let _ = Lwt_main.run (main ()) in
  ()
