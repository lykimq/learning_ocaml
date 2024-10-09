let greet name = Printf.printf "Hello, %s\n" name
let goodbye name = Printf.printf "Goodbye, %s\n" name

let parse_args () =
  let action = ref None in
  let name = ref "" in
  let usage_msg = "Usage: oasis_cli -g NAME | -b NAME" in
  let set_greet n =
    action := Some "greet";
    name := n
  in
  let set_goodbye n =
    action := Some "goodbye";
    name := n
  in

  let args =
    [
      ("--g", Arg.String set_greet, "Greet the user with the specified name");
      ("--b", Arg.String set_goodbye, "Say goodbye to the specified name");
    ]
  in
  Arg.parse args (fun _ -> ()) usage_msg;
  match !action with
  | Some "greet" -> greet !name
  | Some "goodbye" -> goodbye !name
  | _ -> Printf.eprintf "No action specified. Use -g or -b.\n"
