open Alcotest
open Bos
open Rresult

let run_cmd cmd =
  match OS.Cmd.run_out cmd |> OS.Cmd.out_string with
  | Ok (output, _) -> output
  | Error (`Msg e) -> failwith ("Command failed: " ^ e)

let test_greet () =
  let args = [ "input"; "Gwen" ] in
  let start_cmd =
    Bos.Cmd.(v "dune" % "exec" % "ocaml_cli_examples" %% of_list args)
  in
  let output = run_cmd start_cmd in
  check string "check output" output "Hello, Gwen"

let () =
  run "CLI Tests"
    [ ("Greeting Tests", [ test_case "greeting" `Quick test_greet ]) ]
