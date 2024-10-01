open Lwt.Infix
open Ocaml_digestif_hash.Digital_signature_common

module TCP_Server : sig
  val server_connect :
    ?ip:string -> ?port:int -> unit -> Lwt_unix.file_descr Lwt.t

  val server_receive_messages : Lwt_unix.file_descr -> unit Lwt.t
  val server_disconnect : Lwt_unix.file_descr -> unit Lwt.t
  val get_active_connections : unit -> (Lwt_unix.file_descr * string) list
  val server_status : unit -> unit Lwt.t
end = struct
  (* Max number of clients allowed to connect at once *)
  let max_clients = 10
  let connected_clients = ref 0

  (* Flag to indicate server is shutting down *)
  let shutdown_flag = ref false

  (* List to track active client sockets *)
  let client_sockets = ref []

  (* Private and public keys *)
  let server_private_key, server_public_key =
    Digital_signature_common.generate_keys ()

  (* Store client public key *)
  let client_public_key_ref = ref None
  let log msg = Lwt_io.printf "[SERVER] %s\n" msg

  (* Server handshake: Receives client's public key and sends server's public
     key *)
  let server_handshake client_socket =
    let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input client_socket in
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    Lwt.catch
      (fun () ->
        (* Receive client's public key *)
        Lwt_io.read_line_opt input_channel >>= function
        | None -> Lwt_io.printf "Client disconnected during handshake.\n"
        | Some client_public_key_str -> (
            match
              Mirage_crypto_ec.Ed25519.pub_of_octets client_public_key_str
            with
            | Ok client_public_key ->
                client_public_key_ref := Some client_public_key;
                Lwt_io.printf "Received client public key.\n" >>= fun () ->
                (* Send server's public key to the client *)
                let server_public_key_str =
                  Mirage_crypto_ec.Ed25519.pub_to_octets server_public_key
                in
                Lwt_io.write_line output_channel server_public_key_str
                >>= fun () ->
                log "Sent server public key to client." >>= fun () ->
                Lwt.return_unit
            | Error _ -> Lwt.fail_with "Failed to deserialize client public key"
            ))
      (fun exn ->
        Lwt_io.printf "Handshake failed: %s\n" (Printexc.to_string exn)
        >>= fun () -> Lwt.fail exn)

  (* Remove a client from the active connections and close its socket *)
  let remove_client client_socket input_channel output_channel =
    client_sockets :=
      List.filter (fun (socket, _) -> socket != client_socket) !client_sockets;
    Lwt_io.printf "Client disconnected.\n" >>= fun () ->
    Lwt_io.close input_channel >>= fun () -> Lwt_io.close output_channel

  (* Process the message received from the client *)
  let process_message message_str output_channel =
    let open Messages.Message in
    (* Decode and process the message *)
    let message = decode_message message_str in
    (* Verify the client message if it is signed *)
    match (message.signature, !client_public_key_ref) with
    | Some _, Some client_public_key ->
        if verify_signature (module Blak2b) client_public_key message then
          log "Signature verificaiton successful.\n" >>= fun () ->
          log ("Received message : %s\n" ^ message.payload) >>= fun () ->
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
        else Lwt.fail (Errors.MessageError "Invalid client signature")
    | None, _ -> log "Message is not signed.\n" >>= fun () -> Lwt.return_unit
    | _, None -> Lwt.fail_with "No client public key available."

  let received_message_with_timeout input_channel timeout_duration =
    Lwt_unix.with_timeout timeout_duration (fun () ->
        Lwt_io.read_line_opt input_channel)

  (* After successful handshakes, handle client messages *)
  let server_receive_messages client_socket =
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
            remove_client client_socket input_channel output_channel
        | Some message_str ->
            (* Process the client's message *)
            process_message message_str output_channel >>= fun () ->
            Lwt_io.close input_channel)
      (fun exn ->
        Lwt_io.close input_channel >>= fun () ->
        Lwt_io.close output_channel >>= fun () ->
        Lwt.fail
          (Errors.ConnectionError
             ("Client handling error: " ^ Printexc.to_string exn)))

  (* First does handshake, then handles messages *)
  let handle_client client_socket =
    Lwt.catch
      (fun () ->
        server_handshake client_socket >>= fun () ->
        server_receive_messages client_socket)
      (fun exn -> log ("Client error: %s\n" ^ Printexc.to_string exn))

  (* Create a new TCP server socket and bind it to the specifed IP and port *)
  let create_server_socket ip port =
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

  (* Handle case where maximum clients are reached: reject new client *)
  let handle_max_clients server_socket =
    Lwt_io.printf "Max client reached, rejecting new client.\n" >>= fun () ->
    Lwt_unix.accept server_socket >>= fun (client_socket, _) ->
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    (* Send rejection message to the client *)
    Lwt_io.write_line output_channel "Server is at capacity, try again later."
    >>= fun () ->
    Lwt_io.close output_channel >>= fun () -> Lwt_unix.close client_socket

  (* Accept new clients and handle connections *)

  let rec accept_clients server_socket =
    if !shutdown_flag then
      Lwt_io.printf "Server is shutting down, no new connections.\n"
    else if !connected_clients >= max_clients then
      handle_max_clients server_socket >>= fun () ->
      (* Retry accepting clients after a short delay *)
      Lwt_unix.sleep 5.0 >>= fun () -> accept_clients server_socket
    else
      (* Accept new incoming connections *)
      Lwt_unix.accept server_socket >>= fun (client_socket, client_addr) ->
      incr connected_clients;
      client_sockets := (client_socket, client_addr) :: !client_sockets;
      (* Print the IP address of the connected client *)
      let client_ip =
        match client_addr with
        | Lwt_unix.ADDR_INET (addr, _) -> Unix.string_of_inet_addr addr
        | _ -> failwith "Invalid address"
      in
      Lwt_io.printf "Client connected: %s\n" client_ip >>= fun () ->
      (* Lauch client handling in an asynchronous task *)
      Lwt.async (fun () -> handle_client client_socket);
      (* Continue accepting new clients *)
      accept_clients server_socket

  (* Server listens for incoming connections and process requests *)
  let server_connect ?(ip = "127.0.0.1") ?(port = 8080) () =
    Lwt.catch
      (fun () ->
        create_server_socket ip port >>= fun server_socket ->
        Lwt.async (fun () -> accept_clients server_socket);
        Lwt.return server_socket)
      (fun exn ->
        Lwt.fail
          (Errors.ConnectionError
             ("Server start error: " ^ Printexc.to_string exn)))

  (* Stop the server and close all connections *)
  let server_disconnect server_socket =
    shutdown_flag := true;
    (* Close the listening socket to stop accepting new connections *)
    Lwt_unix.close server_socket >>= fun () ->
    (* Close all active client connections *)
    Lwt_list.iter_p
      (fun (client_socket, _) ->
        Lwt_io.printf "Closing connection for a client...\n" >>= fun () ->
        Lwt_unix.close client_socket)
      !client_sockets
    >>= fun () ->
    (* Clear the client socket lists *)
    client_sockets := [];
    log "Server stopped.\n"

  let get_active_connections () =
    List.map
      (fun (client_socket, client_addr) ->
        match client_addr with
        | Lwt_unix.ADDR_INET (addr, _) ->
            (client_socket, Unix.string_of_inet_addr addr)
        | _ -> (client_socket, "Unknown"))
      !client_sockets

  (* Check the status of the server *)
  let server_status () =
    let client_count = List.length !client_sockets in
    Lwt_io.printf "Active connections: %d\n" client_count >>= fun () ->
    if client_count > 0 then
      Lwt_io.printf "Server Status:\n" >>= fun () ->
      Lwt_list.iter_p
        (fun (_, client_addr) ->
          Lwt_io.printf "Client: %s\n"
            (Unix.string_of_inet_addr
               (match client_addr with
               | Lwt_unix.ADDR_INET (addr, _) -> addr
               | _ -> raise (Errors.MessageError "Invalid client address"))))
        !client_sockets
    else Lwt_io.printf "No active connections.\n"
end
