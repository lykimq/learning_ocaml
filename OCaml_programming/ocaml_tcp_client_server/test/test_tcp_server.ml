open Lwt.Infix
open Alcotest
open Ocaml_tcp_client_server

let test_create_socket () =
  let port = 8080 in
  let server_socket =
    Tcp_server.TCP_Server.create_socket port >>= fun socket ->
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
  let port = 8081 in
  let timeout_duration = 2.0 in
  let shutdown_flag = Lwt_switch.create () in
  let server =
    Lwt.pick
      [
        ( Tcp_server.TCP_Server.start_server port shutdown_flag >|= fun _ ->
          check bool "Server stared without issue" true true );
        ( Lwt_unix.sleep timeout_duration >|= fun () ->
          check bool "Timeout reached, stopping server" true true );
      ]
  in
  Lwt_main.run server

let test_send_receive_message () =
  let open Messages.Message in
  let port = 8082 in
  let server_shutdown_flag = Lwt_switch.create () in
  let client_shutdown_flag = Lwt_switch.create () in
  let test_scenario =
    (* Start the server *)
    Tcp_server.TCP_Server.start_server port server_shutdown_flag
    >>= fun server_socket ->
    (* Connect the client to the server *)
    Tcp_client.TCP_Client.connect_to_server "127.0.0.1" port
    >>= fun client_socket ->
    (* Create and send a message *)
    let message =
      {
        msg_type = Request;
        payload = "Test message";
        timestamp = string_of_float (Unix.time ());
        hash = "";
        signature = None;
      }
    in
    let signed_message =
      sign_message
        (module Blak2b)
        Tcp_server.TCP_Server.server_private_key message
    in
    let encoded_message = encode_message signed_message in

    (* Send the message *)
    Tcp_client.TCP_Client.send_message client_socket encoded_message
    >>= fun () ->
    (* Receive a response from the server *)
    Tcp_client.TCP_Client.receive_message client_socket >>= fun response ->
    (* Decode the message *)
    let decoded_response = decode_message response in

    (* Check the response message *)
    check string "Response received"
      ("Acknowledge: " ^ message.payload)
      decoded_response.payload;
    (* Stop the server *)
    Lwt_unix.sleep 3.0 >>= fun () ->
    Tcp_server.TCP_Server.stop_server server_shutdown_flag server_socket
    >>= fun () ->
    Tcp_client.TCP_Client.stop_client client_shutdown_flag
      (Lwt_unix.unix_file_descr client_socket)
    >>= fun () -> Lwt_switch.turn_off client_shutdown_flag
  in

  Lwt_main.run test_scenario

let test_stop_server () =
  let port = 8083 in
  let shutdown_flag = Lwt_switch.create () in
  let server_scenario =
    Tcp_server.TCP_Server.start_server port shutdown_flag
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
    test_case "Send-Receive Message" `Quick test_send_receive_message;
  ]

let () = Alcotest.run "TCP Server Tests" [ ("Server", tests) ]
