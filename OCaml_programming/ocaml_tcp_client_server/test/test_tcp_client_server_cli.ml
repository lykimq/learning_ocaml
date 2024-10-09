open Alcotest
open Lwt.Infix
open Ocaml_tcp_client_server

let find_free_port () =
  let open Unix in
  let sock = socket PF_INET SOCK_STREAM 0 in
  bind sock (ADDR_INET (inet_addr_any, 0));
  let port =
    match getsockname sock with
    | ADDR_INET (_, port) -> port
    | _ -> failwith "Failed to find free port"
  in
  close sock;
  port

let test_start_server () =
  let ip = "127.0.0.1" in
  let port = find_free_port () in
  let shutdown_flag = Lwt_switch.create () in
  let test_case =
    Tcp_server.TCP_Server.start_server ~ip ~port shutdown_flag >>= fun _ ->
    Logs_lwt.info (fun m -> m "Server started successfully") >>= fun () ->
    Tcp_server.TCP_Server.stop_server shutdown_flag (Obj.magic ())
  in
  Lwt_main.run test_case;
  check pass "Server started and stopped successfully" true true

let suite =
  [
    ( "TCP Server CLI",
      [ test_case "Server start/stop" `Quick test_start_server ] );
  ]

let () = run "TCP CLI Tests" suite
