open Alcotest
open Lwt.Infix
open Ocaml_tcp_client_server

let test_start_client () =
  let port = 8086 in
  let host = "127.0.0.1" in
  let server_shutdown_flag = Lwt_switch.create () in
  let client_shutdown_flag = Lwt_switch.create () in

  (* Start the server first *)
  let server_scenario =
    Tcp_server.TCP_Server.start_server port server_shutdown_flag >>= fun _ ->
    Logs_lwt.info (fun m -> m "Server started.") >>= fun () -> Lwt.return_unit
  in

  (* Start the client after the server is ready *)
  let client_scenario =
    Lwt_unix.sleep 0.5 >>= fun () ->
    (* Delay to ensure server is up *)
    Tcp_client.TCP_Client.start_client host port client_shutdown_flag
    >>= fun () ->
    Logs_lwt.info (fun m -> m "Client started.") >>= fun () -> Lwt.return_unit
  in

  (* Run both client and server in parallel *)
  let both_scenarios =
    Lwt.join [ server_scenario; client_scenario ] >>= fun () ->
    (* Simulate a brief interaction period, then shutdown *)
    Lwt_unix.sleep 3.0 >>= fun () ->
    (* Stop the client and the server gracefully *)
    Lwt_switch.turn_off client_shutdown_flag >>= fun () ->
    Lwt_switch.turn_off server_shutdown_flag
  in

  Lwt_main.run both_scenarios

let tests = [ test_case "Start client-server" `Quick test_start_client ]

let () =
  Alcotest.run ~and_exit:true ~verbose:true "TCP Client-Server Tests"
    [ ("Client-Server", tests) ]
