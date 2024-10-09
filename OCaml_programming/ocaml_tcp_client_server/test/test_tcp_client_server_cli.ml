open Alcotest
open Bos
open Rresult
open Lwt.Infix

(* Retry logic for port binding with delay and port availability check *)
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

let is_port_free port =
  let cmd = Printf.sprintf "lsof -i :%d" port in
  let result = Sys.command cmd in
  result = 1 (* lsof returns 1 if no process is using the port *)

let run_cmd cmd =
  match OS.Cmd.run_out cmd |> OS.Cmd.out_string with
  | Ok (output, _) -> output
  | Error (`Msg e) -> failwith ("Command failed: " ^ e)

(* Retry logic for port binding with delay and port availability check *)
let rec check_cli_start_server ?(retry_count = 5) () =
  if retry_count = 0 then failwith "Failed to start server after retries";

  (* Run the CLI to start the server on a free port *)
  let ip = "127.0.0.1" in
  let port = find_free_port () in

  Printf.printf "Attempting to bind to IP %s and port %d...\n" ip port;

  (* Check if the port is free before starting the server *)
  if not (is_port_free port) then
    Printf.printf "Port %d is already in use.\n" port
  else Printf.printf "Port %d is free. Attempting to start server...\n" port;

  let start_cmd =
    Cmd.(
      v "dune" % "exec" % "tcp_server" % "--" % "start" % "--ip" % ip % "--port"
      % string_of_int port)
  in
  try
    let output = run_cmd start_cmd in
    Printf.printf "CLI Output: %s\n" output;
    (* Check if the output indicates successful server start *)
    if not (String.contains output 'S') then
      failwith "Server did not start successfully";
    Lwt.return_unit
  with Failure e ->
    Printf.printf "Retrying due to error: %s\n" e;
    (* Introduce a short delay before retrying *)
    Lwt_unix.sleep 1.0 >>= fun () ->
    check_cli_start_server ~retry_count:(retry_count - 1) ()

let suite =
  [
    ( "TCP Server CLI",
      [
        test_case "CLI start server" `Quick (fun () ->
            Lwt_main.run (check_cli_start_server ()));
      ] );
  ]

let () = Alcotest.run "TCP CLI Tests" suite

let suite =
  [
    ( "TCP Server CLI",
      [
        test_case "CLI start server" `Quick (fun () ->
            Lwt_main.run (check_cli_start_server ()));
      ] );
  ]

let () = Alcotest.run "TCP CLI Tests" suite
