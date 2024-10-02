open Lwt.Infix
open Ocaml_digestif_hash.Digital_signature_common

module TCP_Server : sig
  val start_server :
    ?ip:string -> ?port:int -> unit -> Lwt_unix.file_descr Lwt.t

  val server_receive_messages : Lwt_unix.file_descr -> unit Lwt.t
  val stop_server : Lwt_unix.file_descr -> unit Lwt.t
  val get_active_connections : unit -> (Lwt_unix.file_descr * string) list
  val server_status : unit -> unit Lwt.t
end = struct
  (* Max number of clients allowed to connect at once *)
  let max_clients = 10
  let connected_clients = ref 0

  (* Flag to indicate server is shutting down *)
  let shutdown_flag = ref false

  (* Initial size of 100 slots *)
  let client_sockets = Hashtbl.create 100

  (* Private and public keys *)
  let server_private_key, server_public_key =
    Digital_signature_common.generate_keys ()

  (* Store client public key *)
  let client_public_key_ref = ref None
  let log_attemp level msg = Logs.log_to_console_and_file level msg

  (* Condition to notify the server when a client disconnects *)
  let client_disconnect_condition = Lwt_condition.create ()

  (* Add a new client to the hash table *)
  let add_client client_socket client_addr =
    let client_ip =
      match client_addr with
      | Lwt_unix.ADDR_INET (addr, _) -> Unix.string_of_inet_addr addr
      | _ -> "Unknown"
    in
    Hashtbl.add client_sockets client_socket client_ip;
    incr connected_clients;
    Lwt_io.printf "Client connected: %s\n" client_ip

  (* Clean up resources after a client disconnects and notify the server *)
  let cleanup_resources client_socket input_channel output_channel =
    Hashtbl.remove client_sockets client_socket;
    decr connected_clients;
    (* Notify that a client slot is free now *)
    Lwt_condition.signal client_disconnect_condition ();
    (* Explicitly close channels and socket to release resources *)
    Lwt_io.close input_channel >>= fun () ->
    Lwt_io.close output_channel >>= fun () ->
    Lwt_unix.close client_socket >>= fun () ->
    log_attemp Logs.Level.INFO
      "Cleaned up resources and closed client connection."

  (* Server handshake: Receives client's public key and sends server's public
     key *)
  let server_handshake client_socket =
    log_attemp Logs.Level.INFO "Starting handshake with client" >>= fun () ->
    let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input client_socket in
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    Lwt.catch
      (fun () ->
        (* Receive client's public key *)
        Lwt_io.read_line_opt input_channel >>= function
        | None ->
            log_attemp Logs.Level.ERROR
              "Client disconnected during handshake.\n"
            >>= fun () ->
            cleanup_resources client_socket input_channel output_channel
            >>= fun () ->
            Lwt.fail
              (Errors.ConnectionError "Client disconnected during handshake")
        | Some client_public_key_str -> (
            match
              Mirage_crypto_ec.Ed25519.pub_of_octets client_public_key_str
            with
            | Ok client_public_key ->
                client_public_key_ref := Some client_public_key;
                log_attemp Logs.Level.INFO "Received client public key.\n"
                >>= fun () ->
                (* Send server's public key to the client *)
                let server_public_key_str =
                  Mirage_crypto_ec.Ed25519.pub_to_octets server_public_key
                in
                Lwt_io.write_line output_channel server_public_key_str
                >>= fun () ->
                log_attemp Logs.Level.INFO "Sent server public key to client."
                >>= fun () -> Lwt.return_unit
            | Error _ ->
                log_attemp Logs.Level.ERROR
                  "Failed to deserialize client public key"
                >>= fun () ->
                cleanup_resources client_socket input_channel output_channel
                >>= fun () ->
                Lwt.fail
                  (Errors.MessageError "Invalid client public key format.")))
      (fun exn ->
        log_attemp Logs.Level.ERROR
          ("Handshake failed: %s\n" ^ Printexc.to_string exn)
        >>= fun () ->
        cleanup_resources client_socket input_channel output_channel)

  (* Process the message received from the client *)
  let process_message message_str output_channel =
    let open Messages.Message in
    (* Decode and process the message *)
    let message = decode_message message_str in
    (* Verify the client message if it is signed *)
    match (message.signature, !client_public_key_ref) with
    | Some _, Some client_public_key ->
        if verify_signature (module Blak2b) client_public_key message then
          log_attemp Logs.Level.INFO "Signature verificaiton successful.\n"
          >>= fun () ->
          log_attemp Logs.Level.INFO
            ("Received message : %s\n" ^ message.payload)
          >>= fun () ->
          let response_message =
            {
              msg_type = Response;
              payload = "Acknowledge " ^ message.payload;
              timestamp = string_of_float (Unix.time ());
              hash = "";
              signature = None;
            }
          in
          let response_message_hash =
            hash_message (module Blak2b) response_message
          in
          let response_message =
            { response_message with hash = response_message_hash }
          in
          let signed_response =
            match response_message.msg_type with
            | Critical ->
                sign_message (module Blak2b) server_private_key response_message
            | _ -> response_message
          in
          let encoded_message = encode_message signed_response in
          (* Send the encoded response back to the client *)
          Lwt_io.write_line output_channel encoded_message
        else
          log_attemp Logs.Level.ERROR "Invalid client signature." >>= fun () ->
          Lwt.fail (Errors.MessageError "Invalid client signature")
    | None, _ ->
        log_attemp Logs.Level.INFO "Message is not signed.\n" >>= fun () ->
        Lwt.return_unit
    | _, None ->
        log_attemp Logs.Level.ERROR "No client public key available"
        >>= fun () -> Lwt.fail_with "No client public key available."

  let received_message_with_timeout input_channel timeout_duration =
    Lwt_unix.with_timeout timeout_duration (fun () ->
        Lwt_io.read_line_opt input_channel)

  (* After successful handshakes, handle client messages *)
  let server_receive_messages client_socket =
    log_attemp Logs.Level.DEBUG "Receving message from client" >>= fun () ->
    let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input client_socket in
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    let timeout_duration = 10.0 (* seconds *) in
    Lwt.catch
      (fun () ->
        (* set timeout for reading the client message *)
        received_message_with_timeout input_channel timeout_duration
        >>= function
        | None ->
            (* Handle client disconnection *)
            log_attemp Logs.Level.INFO "Client disconnected." >>= fun () ->
            cleanup_resources client_socket input_channel output_channel
        | Some message_str ->
            (* Process the client's message *)
            process_message message_str output_channel >>= fun () ->
            cleanup_resources client_socket input_channel output_channel)
      (fun exn ->
        log_attemp Logs.Level.ERROR
          ("Error handling client message: " ^ Printexc.to_string exn)
        >>= fun () ->
        cleanup_resources client_socket input_channel output_channel)

  (* First does handshake, then handles messages *)
  let handle_client client_socket =
    let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input client_socket in
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    Lwt.catch
      (fun () ->
        server_handshake client_socket >>= fun () ->
        server_receive_messages client_socket >>= fun () ->
        (* After messages are handled, clean up resources *)
        cleanup_resources client_socket input_channel output_channel)
      (fun exn ->
        (* In case of error, log it and clean up resources *)
        log_attemp Logs.Level.ERROR
          ("Client error: %s\n" ^ Printexc.to_string exn)
        >>= fun () ->
        cleanup_resources client_socket input_channel output_channel)

  (* Create a new TCP server socket and bind it to the specifed IP and port *)
  let create_server_socket ip port =
    log_attemp Logs.Level.INFO
      (Printf.sprintf "Creating server socket on %s:%d" ip port)
    >>= fun () ->
    (* Create a new TCP socket using Lwt_unix.socket
       - PF_INET: using IPv4 protocol
       - SOCK_STREAM: this will be a TCP connection (not UDP)
    *)
    let server_socket = Lwt_unix.socket PF_INET SOCK_STREAM 0 in
    (* Create an address to bind to the socket to
       - ADDR_INET: binds the socket to an IPv4 address and a specific port
       - Unix.inet_addr_loop_back: represents the localhost IP address (127.0.0.1)
       - 8080: is the port we are binding to
    *)
    let addr = Lwt_unix.ADDR_INET (Unix.inet_addr_of_string ip, port) in
    Lwt_unix.bind server_socket addr >>= fun () ->
    Lwt_unix.listen server_socket max_clients;
    Lwt_io.printf "Server started on %s:%d\n" ip port >>= fun () ->
    Lwt.return server_socket

  (* Handle max clients by waiting for a free slot *)
  let handle_max_clients server_socket =
    log_attemp Logs.Level.INFO "Max client reached, waiting for a free slot.\n"
    >>= fun () ->
    (* Wait for the condition to be triggered when a client disconnects *)
    Lwt_condition.wait client_disconnect_condition >>= fun () ->
    log_attemp Logs.Level.INFO "Client slot freed, retrying connection."
    >>= fun () ->
    Lwt_unix.accept server_socket >>= fun (client_socket, _) ->
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    (* Send rejection message to the client *)
    Lwt.catch
      (fun () ->
        Lwt_io.write_line output_channel
          "Server is at capacity, try again later."
        >>= fun () ->
        Lwt_io.close output_channel >>= fun () -> Lwt_unix.close client_socket)
      (fun exn ->
        log_attemp Logs.Level.ERROR
          ("Error sending rejection message: " ^ Printexc.to_string exn)
        >>= fun () -> Lwt_unix.close client_socket)

  (* Accept new clients and handle connections *)

  let rec accept_clients server_socket =
    if !shutdown_flag then
      Lwt_io.printf "Server is shutting down, no new connections.\n"
    else if !connected_clients >= max_clients then
      handle_max_clients server_socket
    else
      (* Accept new incoming connections *)
      Lwt_unix.accept server_socket >>= fun (client_socket, client_addr) ->
      add_client client_socket client_addr >>= fun () ->
      (* Lauch client handling in an asynchronous task *)
      Lwt.async (fun () -> handle_client client_socket);
      (* Continue accepting new clients *)
      accept_clients server_socket

  (* Server listens for incoming connections and process requests *)
  let start_server ?(ip = "127.0.0.1") ?(port = 8080) () =
    log_attemp Logs.Level.INFO
      (Printf.sprintf "Starting server on %s:%d" ip port)
    >>= fun () ->
    Lwt.catch
      (fun () ->
        create_server_socket ip port >>= fun server_socket ->
        Lwt.async (fun () -> accept_clients server_socket);
        Lwt.return server_socket)
      (fun exn ->
        log_attemp Logs.Level.ERROR
          ("Server start error: " ^ Printexc.to_string exn)
        >>= fun () ->
        Lwt.fail
          (Errors.ConnectionError
             ("Server start error: " ^ Printexc.to_string exn)))

  (* Stop the server and close all connections *)
  let stop_server server_socket =
    log_attemp Logs.Level.INFO "Disconneting server" >>= fun () ->
    shutdown_flag := true;
    (* Close the listening socket to stop accepting new connections *)
    Lwt_unix.close server_socket >>= fun () ->
    (* Close all active client connections *)
    let close_client_sockets () =
      Hashtbl.fold
        (fun client_socket _ acc ->
          acc >>= fun () ->
          log_attemp Logs.Level.INFO "Closing connection for a client...\n"
          >>= fun () -> Lwt_unix.close client_socket)
        client_sockets Lwt.return_unit
    in
    close_client_sockets () >>= fun () ->
    (* Clear the client sockets hash table *)
    Hashtbl.reset client_sockets;
    log_attemp Logs.Level.INFO "Server stopped.\n"

  let get_active_connections () =
    Hashtbl.fold
      (fun client_socket client_ip acc -> (client_socket, client_ip) :: acc)
      client_sockets []

  (* Check the status of the server *)
  let server_status () =
    let client_count = Hashtbl.length client_sockets in
    log_attemp Logs.Level.INFO
      (Printf.sprintf "Active connections: %d\n" client_count)
    >>= fun () ->
    if client_count > 0 then
      log_attemp Logs.Level.INFO "Server Status:\n" >>= fun () ->
      Hashtbl.fold
        (fun _ client_ip acc ->
          acc >>= fun () -> Lwt_io.printf "Client: %s\n" client_ip)
        client_sockets Lwt.return_unit
    else log_attemp Logs.Level.INFO "No active connections.\n"
end
