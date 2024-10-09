open Cmdliner

let greet name = Printf.printf "Hello, %s\n" name
let start_info = Cmd.info "input" ~doc:"CLI example"

let start_cmd =
  let name_arg =
    let doc = "The name of the person to greet." in
    Arg.(required & pos 0 (some string) None & info [] ~docv:"NAME" ~doc)
  in
  Term.(const greet $ name_arg)

let cmd =
  let info = Cmd.info "cli_example" ~doc:"A simple CLI example." in
  Cmd.group info [ Cmd.v start_info start_cmd ]

let () = exit (Cmd.eval cmd)
