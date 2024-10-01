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
      let socket =
        Ocaml_gc_tcp_server_client.Tcp_client.TCP_Client.client_connect ~ip
          ~port
      in
      client_socket := Some socket;
      Lwt_io.printf "Client started on %s:%d.\n" ip port

let send_message () =
  if Array.length Sys.argv < 4 then
    failwith "Usage: ./tcp_client send <message_type> <message>"
  else
    let msg_type =
      match Sys.argv.(2) with
      | "Request" -> Messages.Message.Request
      | "Critical" -> Critical
      | "Info" -> Info
      | "Warning" -> Warning
      | "Debug" -> Debug
      | "Error" -> Error
      | _ -> failwith "Invalid message type"
    in
    let payload = Sys.argv.(3) in
    Tcp_client.TCP_Client.client_send_message ~msg_type payload

let sign_message () =
  if Array.length Sys.argv < 3 then
    failwith "Usage: ./tcp_client sign <message_type:Critical> <message>"
  else
    let msg_type =
      match Sys.argv.(2) with
      | "Critical" -> Messages.Message.Critical
      | _ -> failwith "Only Critical message type is allowed for sign"
    in
    let payload = Sys.argv.(2) in
    Tcp_client.TCP_Client.client_send_message ~msg_type payload

let stop_client () = Tcp_client.TCP_Client.client_disconnect ()
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
