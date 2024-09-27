open Lwt.Infix

(* Variable to store the running server socket, if started *)
let server_socket = ref None

(* Handle CLI arguments *)
let parse_args () =
  if Array.length Sys.argv < 2 then
    failwith "Usage: ./tcp_server <start|stop|status|connections>"
  else Sys.argv.(1)

(* Function to start the server *)
let start_server () =
  match !server_socket with
  | Some _ -> Lwt_io.printf "Server is already running.\n"
  | None ->
      (* Start the TCP server using the [server_start] function *)
      Lwt_io.printf "Starting the server...\n" >>= fun () ->
      let socket =
        Ocaml_gc_tcp_server_client.Tcp_server.TCP_Server.server_start ()
      in
      server_socket := Some socket;
      Lwt_io.printf "Server started.\n"

(* Function to stop the server *)
let stop_server () =
  match !server_socket with
  | None -> Lwt_io.printf "Server is not running.\n"
  | Some socket_promise ->
      Lwt_io.printf "Stopping the server...\n" >>= fun () ->
      (* Unwrapping the Lwt promise to get the actual socket *)
      socket_promise >>= fun socket ->
      Ocaml_gc_tcp_server_client.Tcp_server.TCP_Server.stop_server socket
      >>= fun () ->
      server_socket := None;
      Lwt_io.printf "Server stopped.\n"

(* Function to view active connections *)
let view_connections () =
  match !server_socket with
  | None -> Lwt_io.printf "Server is not running.\n"
  | Some _ ->
      let connections =
        Ocaml_gc_tcp_server_client.Tcp_server.TCP_Server.get_active_connections
          ()
      in
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
      Ocaml_gc_tcp_server_client.Tcp_server.TCP_Server.status_server ()
      >>= fun () -> Lwt_io.printf "Server status checked.\n"

let main () =
  let command = parse_args () in
  match command with
  | "start" -> start_server ()
  | "connections" -> view_connections ()
  | "stop" -> stop_server ()
  | "status" -> status_check ()
  | _ -> Lwt_io.printf "Unknown command: %s\n" command

let () =
  let _ = Lwt_main.run (main ()) in
  ()
