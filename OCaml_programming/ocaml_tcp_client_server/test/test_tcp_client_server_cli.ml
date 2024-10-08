open Alcotest
open Bos

let run_command cmd =
  match OS.Cmd.run_out (Cmd.v cmd) |> OS.Cmd.to_string with
  | Ok output -> output
  | Error (`Msg e) -> fail ("Command failed: " ^ e)

let test_server_start_stop () =
  let start_output =
    run_command "./tcp_server_cli start -ip 127.0.0.1 -port 8080"
  in
  check string "Server stared" start_output
    "Server started. Press Ctrl+C to stop.\n"

let suite =
  [
    ( "TCP Server CLI",
      [ test_case "Server start/stop" `Quick test_server_start_stop ] );
  ]

let () = run "TCP CLI Tests" suite
