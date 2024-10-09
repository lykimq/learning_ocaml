open Alcotest
open Bos
open Rresult

let run_cmd cmd =
  match OS.Cmd.run_out cmd |> OS.Cmd.out_string with
  | Ok (output, _) -> output
  | Error (`Msg e) -> failwith ("Command failed: " ^ e)

let test_greet () =
  let args = [ "Gwen" ] in
  let start_cmd =
    Bos.Cmd.(v "dune" % "exec" % "arg_cli" % "--" % "--g" %% of_list args)
    (* Correctly place the "--" before "-g" *)
  in
  let output = run_cmd start_cmd in
  check string "check greet output" output "Hello, Gwen"

let test_goodbye () =
  let args = [ "Gwen" ] in
  let start_cmd =
    Bos.Cmd.(v "dune" % "exec" % "arg_cli" % "--" % "--b" %% of_list args)
    (* Correctly place the "--" before "-b" *)
  in
  let output = run_cmd start_cmd in
  check string "check greet output" output "Goodbye, Gwen"

let () =
  run "OASIS CLI Tests"
    [
      ( "Greet and Goodbye tests",
        [
          test_case "greeting" `Quick test_greet;
          test_case "goodbye" `Quick test_goodbye;
        ] );
    ]
