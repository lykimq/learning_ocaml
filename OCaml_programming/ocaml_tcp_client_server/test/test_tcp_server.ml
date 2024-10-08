open Lwt.Infix
open Alcotest
open Ocaml_tcp_client_server

let test_create_socket () =
  let host = "127.0.0.1" in
  let port = 8080 in
  let server_socket =
    Tcp_server.TCP_Server.create_socket host port >>= fun socket ->
    let is_valid_socket =
      try
        ignore (Unix.getsockname socket);
        true
      with Unix.Unix_error (Unix.EBADF, _, _) -> false
    in
    check bool "Socket is valid" true is_valid_socket;
    Lwt.return_unit
  in
  Lwt_main.run server_socket

let test_start_server () =
  let ip = "127.0.0.1" in
  let port = 8081 in
  let timeout_duration = 2.0 in
  let shutdown_flag = Lwt_switch.create () in
  let server =
    Lwt.pick
      [
        ( Tcp_server.TCP_Server.start_server ~ip ~port shutdown_flag >|= fun _ ->
          check bool "Server stared without issue" true true );
        ( Lwt_unix.sleep timeout_duration >|= fun () ->
          check bool "Timeout reached, stopping server" true true );
      ]
  in
  Lwt_main.run server

let test_stop_server () =
  let ip = "127.0.0.1" in
  let port = 8083 in
  let shutdown_flag = Lwt_switch.create () in
  let server_scenario =
    Tcp_server.TCP_Server.start_server ~ip ~port shutdown_flag
    >>= fun server_socket ->
    Lwt_unix.sleep 3.0 >>= fun () ->
    Tcp_server.TCP_Server.stop_server shutdown_flag server_socket >>= fun () ->
    check bool "Server stopped" true true;
    Lwt.return_unit
  in
  Lwt_main.run server_scenario

let tests =
  [
    test_case "Create server socket" `Quick test_create_socket;
    test_case "Start server" `Quick test_start_server;
    test_case "Stop server" `Quick test_stop_server;
  ]

let () = Alcotest.run "TCP Server Tests" [ ("Server", tests) ]
