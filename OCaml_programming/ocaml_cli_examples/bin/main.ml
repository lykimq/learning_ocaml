open Cmdliner
open Ocaml_cli_examples

(* dune exec ocaml_cli_examples -- input Gwen *)
let () = exit (Cmd.eval Cmd_cli.cmd)
