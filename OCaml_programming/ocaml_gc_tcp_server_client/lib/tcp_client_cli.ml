open Lwt.Infix
open Ocaml_gc_tcp_server_client

let client_socket = ref None

let start_client () =
  match !client_socket with
  | Some _ -> Lwt_io.printf "Client is already running.\n"
  | None ->
      (* Start the TCP client using the [client_connect] function *)
      Tcp_cli_utils.parse_args "client" [ "start" ] >>= fun (_, args) ->
      let ip, port = Tcp_cli_utils.get_ip_port args in
      Lwt_io.printf "Starting the client on %s:%d...\n" ip port >>= fun () ->
      let socket = Tcp_client.TCP_Client.start_client ~ip ~port in
      client_socket := Some socket;
      Lwt_io.printf "Client started on %s:%d.\n" ip port

let valid_message_type msg_type_str =
  match msg_type_str with
  | "Request" -> Ok Messages.Message.Request
  | "Critical" -> Ok Critical
  | "Info" -> Ok Info
  | "Warning" -> Ok Warning
  | "Debug" -> Ok Debug
  | "Error" -> Ok Error
  | _ -> Error ("Invalid message type " ^ msg_type_str)

let send_message () =
  if Array.length Sys.argv < 4 then
    failwith "Usage: ./tcp_client send <message_type> <message>"
  else
    match valid_message_type Sys.argv.(2) with
    | Error err -> failwith err
    | Ok msg_type ->
        let payload = Sys.argv.(3) in
        Tcp_client.TCP_Client.client_send_message ~msg_type payload

let sign_message () =
  if Array.length Sys.argv < 4 then
    failwith "Usage: ./tcp_client sign <message_type:Critical> <message>"
  else
    let msg_type_str = Sys.argv.(2) in
    match msg_type_str with
    | "Critical" ->
        let payload = Sys.argv.(3) in
        Tcp_client.TCP_Client.client_send_message
          ~msg_type:Messages.Message.Critical payload
    | _ -> failwith "Only Critical message type is allowed for sign"

let stop_client () = Tcp_client.TCP_Client.stop_client ()
let status_client () = Tcp_client.TCP_Client.client_status ()

let main () =
  Tcp_cli_utils.parse_args "client"
    [ "start"; "send"; "sign"; "stop"; "status" ]
  >>= fun (command, _) ->
  match command with
  | "start" -> start_client ()
  | "send" -> send_message ()
  | "sign" -> sign_message ()
  | "stop" -> stop_client ()
  | "status" -> status_client ()
  | _ -> failwith "Unknown command"

let () = Lwt_main.run (main ())
