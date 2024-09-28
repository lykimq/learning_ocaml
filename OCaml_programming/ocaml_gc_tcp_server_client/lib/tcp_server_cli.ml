open Lwt.Infix

(* Variable to store the running server socket, if started *)
let server_socket = ref None
let default_ip = "127.0.0.1"
let default_port = 8080

(* Handle CLI arguments *)
let parse_args () =
  if Array.length Sys.argv < 2 then
    failwith
      "Usage: ./tcp_server <start|stop|status|connections> [-ip <IP>] [-port \
       <Port>]"
  else (Sys.argv.(1), Sys.argv)

(* Function to extract IP and port from the CLI arguments *)
let get_ip_port args =
  let rec aux i ip port =
    if i >= Array.length args then (ip, port)
    else
      match args.(i) with
      | "-ip" when i + 1 < Array.length args ->
          (* Move 2 steps forward (past "-ip" and its value, update ip) *)
          aux (i + 2) args.(i + 1) port
      | "-port" when i + 1 < Array.length args ->
          (* Move 2 steps forward (past "port" and its value), update port*)
          aux (i + 2) ip (int_of_string args.(i + 1))
      | _ ->
          (* For any other arguments, just skip it and move to the next one *)
          aux (i + 1) ip port
  in
  (* Start recursion at index 2, using the default ip and port as initial values *)
  aux 2 default_ip default_port

(* Function to start the server *)
let start_server () =
  match !server_socket with
  | Some _ -> Lwt_io.printf "Server is already running.\n"
  | None ->
      (* Start the TCP server using the [server_start] function *)
      let _, args = parse_args () in
      let ip, port = get_ip_port args in
      Lwt_io.printf "Starting the server on %s:%d...\n" ip port >>= fun () ->
      let socket =
        Ocaml_gc_tcp_server_client.Tcp_server.TCP_Server.start_server ~ip ~port
          ()
      in
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
  let command, _ = parse_args () in
  match command with
  | "start" -> start_server ()
  | "connections" -> view_connections ()
  | "stop" -> stop_server ()
  | "status" -> status_check ()
  | _ -> Lwt_io.printf "Unknown command: %s\n" command

let () =
  let _ = Lwt_main.run (main ()) in
  ()
