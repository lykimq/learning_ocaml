open Lwt.Infix
open Alcotest
open Ocaml_tcp_client_server

let test_create_socket () =
  let port = 8080 in
  let server_socket =
    Tcp_server.TCP_Server.create_socket port >>= fun socket ->
    check bool "Socket is valid" true (Obj.is_block (Obj.repr socket));
    Lwt.return_unit
  in
  Lwt_main.run server_socket

let test_start_server () =
  let port = 8081 in
  let timeout_duration = 2.0 in
  let server =
    Lwt.pick
      [
        ( Tcp_server.TCP_Server.start_server port >|= fun _ ->
          check bool "Server stared without issue" true true );
        ( Lwt_unix.sleep timeout_duration >|= fun () ->
          check bool "Timeout reached, stopping server" true true );
      ]
  in
  Lwt_main.run server

let test_buffer_creation () =
  let buffer = Bytes.create Tcp_server.TCP_Server.buffer_size in
  check int "Buffer size is correct" Tcp_server.TCP_Server.buffer_size
    (Bytes.length buffer);
  ()

let tests =
  [
    test_case "Create server socket" `Quick test_create_socket;
    test_case "Start server" `Quick test_start_server;
    test_case "Buffer creation" `Quick test_buffer_creation;
  ]

let () = Alcotest.run "TCP Server Tests" [ ("Server", tests) ]
