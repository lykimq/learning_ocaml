open Lwt.Infix
open Cmdliner
open Ocaml_tcp_client_server

let setup_logs () =
  Logs.set_reporter (Logs_fmt.reporter ());
  Logs.set_level (Some Logs.Info)

let start_server ip port () =
  setup_logs ();
  let shutdown_flag = Lwt_switch.create () in
  Tcp_server.TCP_Server.create_socket ip port >>= fun _ ->
  Tcp_server.TCP_Server.start_server ~ip ~port shutdown_flag >>= fun _ ->
  Logs_lwt.info (fun m -> m "TCP Server started on port %d" port) >>= fun () ->
  Lwt.return_unit

let start_cmd =
  let ip =
    let doc = "IP address to bind the server." in
    Arg.(value & opt string "127.0.0.1" & info [ "ip" ] ~docv:"IP" ~doc)
  in
  let port =
    let doc = "Port number to listen on." in
    Arg.(value & opt int 8080 & info [ "port" ] ~docv:"PORT" ~doc)
  in
  Term.(
    const (fun ip port -> Lwt_main.run (start_server ip port ())) $ ip $ port)

let start_info = Cmd.info "start" ~doc:"Start the TCP server"

let cmd =
  let doc = "TCP server CLI" in
  let info = Cmd.info "tcp_server_cli" ~version:"v1.0" ~doc in
  Cmd.group info [ Cmd.v start_info start_cmd ]

let () = exit (Cmd.eval cmd)
