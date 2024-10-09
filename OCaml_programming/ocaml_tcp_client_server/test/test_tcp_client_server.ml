open Alcotest
open Lwt.Infix
open Ocaml_tcp_client_server

let test_client_server_connection () =
  let port = 8090 in
  let ip = "127.0.0.1" in
  let server_shutdown_flag = Lwt_switch.create () in
  let client_shutdown_flag = Lwt_switch.create () in
  (* Start the server first *)
  let server_scenario =
    Tcp_server.TCP_Server.start_server ~ip ~port server_shutdown_flag
    >>= fun server_socket ->
    Logs_lwt.info (fun m -> m "Server started.") >>= fun () ->
    Lwt_unix.sleep 3.0 >>= fun () ->
    Tcp_server.TCP_Server.stop_server server_shutdown_flag server_socket
  in
  (* Start the client after the server is ready *)
  let client_scenario =
    Lwt_unix.sleep 0.5 >>= fun () ->
    (* Delay to ensure server is up *)
    Tcp_client.TCP_Client.start_client ip port client_shutdown_flag >>= fun _ ->
    Logs_lwt.info (fun m -> m "Client started.") >>= fun () ->
    Lwt_switch.turn_off client_shutdown_flag
  in
  (* Run both client and server in parallel *)
  let both_scenarios = Lwt.join [ server_scenario; client_scenario ] in
  Lwt_main.run both_scenarios

let test_send_receive_message () =
  let open Messages.Message in
  let ip = "127.0.0.1" in
  let port = 8091 in
  let server_shutdown_flag = Lwt_switch.create () in
  let client_shutdown_flag = Lwt_switch.create () in
  let test_scenario =
    (* Start the server *)
    Tcp_server.TCP_Server.start_server ~ip ~port server_shutdown_flag
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
    Tcp_client.TCP_Client.send_message client_socket encoded_message
    >>= fun () ->
    Tcp_client.TCP_Client.receive_message client_socket >>= fun response ->
    let decoded_response = decode_message response in

    (* Check the response message *)
    check string "Response received"
      ("Acknowledge: " ^ message.payload)
      decoded_response.payload;
    (* Stop the server-client *)
    Lwt_unix.sleep 3.0 >>= fun () ->
    Tcp_server.TCP_Server.stop_server server_shutdown_flag server_socket
    >>= fun () ->
    Tcp_client.TCP_Client.stop_client client_shutdown_flag
      (Lwt_unix.unix_file_descr client_socket)
  in
  Lwt_main.run test_scenario

(* Create 10 clients  *)
let rec create_clients n port =
  let open Messages.Message in
  if n <= 0 then Lwt.return_unit
  else
    Tcp_client.TCP_Client.connect_to_server "127.0.0.1" port
    >>= fun client_socket ->
    let payload = "Test message from client " ^ string_of_int n in
    let message =
      {
        msg_type = Request;
        payload;
        timestamp = string_of_float (Unix.time ());
        hash = "";
        signature = None;
      }
    in
    let encoded_message = encode_message message in
    Tcp_client.TCP_Client.send_message client_socket encoded_message
    >>= fun () ->
    Tcp_client.TCP_Client.receive_message client_socket >>= fun response ->
    let decoded_message = decode_message response in
    check string "Response received"
      ("Acknowledge: " ^ payload)
      decoded_message.payload;
    Tcp_common.safe_close (Lwt_unix.unix_file_descr client_socket) >>= fun () ->
    create_clients (n - 1) port

let test_max_clients_connected () =
  let ip = "127.0.0.1" in
  let port = 8092 in
  let server_shutdown_flag = Lwt_switch.create () in
  let start_server_and_clients () =
    (* Start the server *)
    Tcp_server.TCP_Server.start_server ~ip ~port server_shutdown_flag
    >>= fun server_socket ->
    create_clients Tcp_server.TCP_Server.max_clients port >>= fun () ->
    Tcp_server.TCP_Server.stop_server server_shutdown_flag server_socket
  in
  Lwt_main.run (start_server_and_clients ())

let test_exceed_max_clients () =
  let ip = "127.0.0.1" in
  let port = 8093 in
  let server_shutdown_flag = Lwt_switch.create () in
  let extra_clients = 2 in
  let start_server_and_clients () =
    Tcp_server.TCP_Server.start_server ~ip ~port server_shutdown_flag
    >>= fun server_socket ->
    let create_extra_client n =
      if n <= 0 then Lwt.return_unit
      else
        Lwt.catch
          (fun () ->
            Tcp_client.TCP_Client.connect_to_server "127.0.0.1" port
            >>= fun _ -> fail "Extra client should not have connected")
          (fun _exn -> Lwt.return_unit)
    in
    create_clients Tcp_server.TCP_Server.max_clients port >>= fun () ->
    create_extra_client extra_clients >>= fun () ->
    Tcp_server.TCP_Server.stop_server server_shutdown_flag server_socket
  in
  Lwt_main.run (start_server_and_clients ())

let test_mixed_message_types () =
  let ip = "127.0.0.1" in
  let port = 8094 in
  let server_shutdown_flag = Lwt_switch.create () in
  let start_server_and_clients () =
    Tcp_server.TCP_Server.start_server ~ip ~port server_shutdown_flag
    >>= fun server_socket ->
    (* Create clients that send different message types *)
    let rec create_clients n =
      let open Messages.Message in
      if n <= 0 then Lwt.return_unit
      else
        Tcp_client.TCP_Client.connect_to_server "127.0.0.1" port
        >>= fun client_socket ->
        let msg_type =
          match n mod 5 with
          | 0 -> Request
          | 1 -> Info
          | 2 -> Critical
          | 3 -> Warning
          | _ -> Debug
        in
        let payload = "Test message of type " ^ string_of_msg_type msg_type in
        let message =
          {
            msg_type;
            payload;
            timestamp = string_of_float (Unix.time ());
            hash = "";
            signature = None;
          }
        in
        let encoded_message = encode_message message in
        Tcp_client.TCP_Client.send_message client_socket encoded_message
        >>= fun () ->
        Tcp_client.TCP_Client.receive_message client_socket >>= fun response ->
        let decoded_message = decode_message response in
        check string "Response received"
          ("Acknowledge: " ^ message.payload)
          decoded_message.payload;
        Tcp_common.safe_close (Lwt_unix.unix_file_descr client_socket)
        >>= fun () -> create_clients (n - 1)
    in
    create_clients Tcp_server.TCP_Server.max_clients >>= fun () ->
    Tcp_server.TCP_Server.stop_server server_shutdown_flag server_socket
  in
  Lwt_main.run (start_server_and_clients ())

let test_clients_reconnect () =
  let ip = "127.0.0.1" in
  let port = 8095 in
  let server_shutdown_flag = Lwt_switch.create () in
  let start_server_and_clients () =
    Tcp_server.TCP_Server.start_server ~ip ~port server_shutdown_flag
    >>= fun server_socket ->
    (* Create client, disconnect, and reconnect *)
    let rec connect_disconnect_reconnect n =
      let open Messages.Message in
      if n <= 0 then Lwt.return_unit
      else
        Tcp_client.TCP_Client.connect_to_server "127.0.0.1" port
        >>= fun client_socket ->
        let payload = "Test message from client " ^ string_of_int n in
        let message =
          {
            msg_type = Request;
            payload;
            timestamp = string_of_float (Unix.time ());
            hash = "";
            signature = None;
          }
        in
        let encoded_message = encode_message message in
        Tcp_client.TCP_Client.send_message client_socket encoded_message
        >>= fun () ->
        Tcp_client.TCP_Client.receive_message client_socket >>= fun response ->
        let decoded_message = decode_message response in
        check string "Response received"
          ("Acknowledge: " ^ payload)
          decoded_message.payload;
        Tcp_common.safe_close (Lwt_unix.unix_file_descr client_socket)
        >>= fun () ->
        (* Reconnect the same client *)
        Tcp_client.TCP_Client.connect_to_server "127.0.0.1" port
        >>= fun client_socket ->
        Tcp_client.TCP_Client.send_message client_socket encoded_message
        >>= fun () ->
        Tcp_client.TCP_Client.receive_message client_socket >>= fun response ->
        let decoded_message = decode_message response in
        check string "Response received"
          ("Acknowledge: " ^ payload)
          decoded_message.payload;
        Tcp_common.safe_close (Lwt_unix.unix_file_descr client_socket)
        >>= fun () -> connect_disconnect_reconnect (n - 1)
    in
    connect_disconnect_reconnect Tcp_server.TCP_Server.max_clients >>= fun () ->
    Tcp_server.TCP_Server.stop_server server_shutdown_flag server_socket
  in
  Lwt_main.run (start_server_and_clients ())

let tests =
  [
    test_case "Client-Server connection" `Quick test_client_server_connection;
    test_case "Send and Receive Message" `Quick test_send_receive_message;
    test_case "Max clients connected" `Quick test_max_clients_connected;
    test_case "Exceed max clients connected" `Quick test_exceed_max_clients;
    test_case "Mix messages types" `Quick test_mixed_message_types;
    test_case "Reconnect clients" `Quick test_clients_reconnect;
  ]

let () =
  Alcotest.run ~and_exit:true ~verbose:true "TCP Client-Server Tests"
    [ ("Client-Server", tests) ]
