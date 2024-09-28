open Lwt.Infix
open Ocaml_digestif_hash.Digital_signature_common

module TCP_Server : sig
  val max_clients : int
  val connected_clients : int ref
  val shutdown_flag : bool ref
  val client_sockets : (Lwt_unix.file_descr * Unix.sockaddr) list ref

  val start_server :
    ?ip:string -> ?port:int -> unit -> Lwt_unix.file_descr Lwt.t

  val stop_server : Lwt_unix.file_descr -> unit Lwt.t
  val get_active_connections : unit -> (Lwt_unix.file_descr * string) list
  val status_server : unit -> unit Lwt.t
end = struct
  (* Max number of clients allowed to connect at once *)
  let max_clients = 10
  let connected_clients = ref 0

  (* Flag to indicate server is shutting down *)
  let shutdown_flag = ref false

  (* List to track active client sockets *)
  let client_sockets = ref []

  (* Private and public keys *)
  let server_private_key = Digital_signature_common.generate_keys ()

  (* Store client public key *)
  let client_public_key_ref = ref None

  let handshake client_socket =
    let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input client_socket in
    Lwt_io.read_line_opt input_channel >>= function
    | None -> Lwt_io.printf "Client disconnected during handshake.\n"
    | Some client_public_key_str ->
        client_public_key_ref := Some client_public_key_str;
        Lwt_io.printf "Received client public key.\n" >>= fun () ->
        Lwt_io.printf "Handshake successful.\n"

  (* Handles client messages after handshake *)
  let handle_messages client_socket =
    let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input client_socket in
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output client_socket in
    Lwt.catch
      (fun () ->
        (* Read a line of input from the client, non-blocking *)
        Lwt_io.read_line_opt input_channel >>= function
        | None ->
            (* Remove the client from the list *)
            client_sockets :=
              List.filter
                (fun (socket, _) -> socket != client_socket)
                !client_sockets;
            (* Client disconnected, clean up the socket *)
            Lwt_io.printf "Client disconnected.\n" >>= fun () ->
            Lwt_io.close input_channel >>= fun () -> Lwt_io.close output_channel
        | Some message_str ->
            (* Handle the client's message *)
            Lwt.catch
              (fun () ->
                (* Simulate message decoding *)
                let message = Messages.Message.decode_message message_str in

                (* Verify the client message if it is signed *)
                let verify_result =
                  match message.signature with
                  | Some _ -> (
                      (* Verify the signature using the client's public key *)
                      match !client_public_key_ref with
                      | Some client_public_key_str -> (
                          match
                            Mirage_crypto_ec.Ed25519.pub_of_octets
                              client_public_key_str
                          with
                          | Ok client_public_key ->
                              if
                                Messages.Message.verify_signature
                                  (module Messages.Message.Blak2b)
                                  client_public_key message
                              then
                                Lwt_io.printf
                                  "Signature verification successful.\n"
                              else
                                raise (Errors.MessageError "Invalid signature")
                          | Error _ ->
                              raise
                                (Errors.MessageError
                                   "Failed to deserialize public key "))
                      | None ->
                          raise
                            (Errors.MessageError
                               "No client public key available"))
                  | None -> Lwt_io.printf "Message is not signed.\n"
                in
                (* Log the received message *)
                verify_result >>= fun () ->
                Lwt_io.printf "Received_message: %s\n" message.payload
                >>= fun () ->
                let response_message =
                  {
                    Messages.Message.msg_type = Response;
                    payload = "Acknowledge: " ^ message.payload;
                    timestamp = string_of_float (Unix.time ());
                    hash = "";
                    signature = None;
                  }
                in
                let response_message_hash =
                  Messages.Message.hash_message
                    (module Messages.Message.Blak2b)
                    response_message
                in
                let response_message =
                  { message with hash = response_message_hash }
                in
                (* For this application only sign message that is critical *)
                let signed_response =
                  match response_message.msg_type with
                  | Critical ->
                      (* Sign the response message using the server's private key *)
                      let server_private_key, _ = server_private_key in
                      Messages.Message.sign_message
                        (module Messages.Message.Blak2b)
                        server_private_key response_message
                  | _ -> response_message
                in
                let encoded_response =
                  Messages.Message.encode_message signed_response
                in
                (* Send the encoded response back to the client, writing the message
                   over the socket *)
                Lwt_io.write_line output_channel encoded_response)
              (fun exn ->
                raise
                  (Errors.MessageError
                     ("Error handling client message: " ^ Printexc.to_string exn)))
            >>= fun () -> Lwt_io.close input_channel)
      (fun exn ->
        Lwt_io.close input_channel >>= fun () ->
        Lwt_io.close output_channel >>= fun () ->
        raise
          (Errors.ConnectionError
             ("Client handling error: " ^ Printexc.to_string exn)))

  (* First does handshake, then handles messages *)
  let handle_client client_socket =
    Lwt.catch
      (fun () ->
        handshake client_socket >>= fun () -> handle_messages client_socket)
      (fun exn -> Lwt_io.printf "Client error: %s\n" (Printexc.to_string exn))

  (* Server listens for incoming connections and process requests *)
  let start_server ?(ip = "127.0.0.1") ?(port = 8080) () =
    Lwt.catch
      (fun () ->
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
        let addr = Lwt_unix.ADDR_INET (Unix.inet_addr_loopback, 8080) in
        (* Bind the server to the address: localhost:8080 Lwt_unix.bind associates the
           socket with the address so it can listen for connections
        *)
        Lwt_unix.bind server_socket addr >>= fun () ->
        (* Listening on the socket for incoming connections *)
        Lwt_unix.listen server_socket max_clients;
        Lwt_io.printf "Server started on %s:%d\n" ip port >>= fun () ->
        (* Define a recursive function to continuously accept client connections *)
        let rec accept_clients () =
          (* Check shutdown flag to prevent accepting new clients during shutdown *)
          if !shutdown_flag then
            Lwt_io.printf "Server is shutting down, no new connections.\n"
          else if !connected_clients >= max_clients then
            (* Reject the client because max clients have been reached *)
            Lwt_io.printf "Max client reached, rejecting new client.\n"
            >>= fun () ->
            Lwt_unix.accept server_socket >>= fun (client_socket, _) ->
            (* Send a rejection message to the client and close the connection *)
            let output_channel =
              Lwt_io.of_fd ~mode:Lwt_io.output client_socket
            in
            Lwt_io.write_line output_channel
              "Server is at capacity, try again later."
            >>= fun () ->
            Lwt_io.close output_channel >>= fun () ->
            Lwt_unix.close client_socket >>= fun () ->
            (* Retry accepting clients after a short delay *)
            Lwt_unix.sleep 5.0 >>= fun () -> accept_clients ()
          else
            (* Accept incoming connection (blocks until a connection is made)*)
            Lwt_unix.accept server_socket
            >>= fun (client_socket, client_addr) ->
            (* Increase counter of connected clients *)
            incr connected_clients;
            (* Add client socket and address to the list *)
            client_sockets := (client_socket, client_addr) :: !client_sockets;
            (* Print the IP address of the connected client *)
            Lwt_io.printf "Client connected: %s\n"
              (Unix.string_of_inet_addr
                 (match client_addr with
                 (* Extract the IP address from the client address: IPv4 address *)
                 | Lwt_unix.ADDR_INET (addr, _) -> addr
                 | _ -> failwith "Invalid address"))
            >>= fun () ->
            (* Launch the client handle asynchrounously, allowing the server to accept
               more clients. Lwt.async runs the client handling function without
               blocking the accept loop
            *)
            Lwt.async (fun () -> handle_client client_socket);
            (* Recursively call accept_clients to keep accepting new connections *)
            accept_clients ()
        in
        (* Start accepting clients *)
        Lwt.async accept_clients;
        (* Return the server socket *)
        Lwt.return server_socket)
      (fun exn ->
        raise
          (Errors.ConnectionError
             ("Server start error: " ^ Printexc.to_string exn)))

  (* Stop the server and close all connections *)
  let stop_server server_socket =
    Lwt.catch
      (fun () ->
        Lwt_io.printf "Stopping the server...\n" >>= fun () ->
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
        Lwt_io.printf "Server stopped.\n")
      (fun exn ->
        raise
          (Errors.ConnectionError
             ("Error stopping server: " ^ Printexc.to_string exn)))

  let get_active_connections () =
    List.map
      (fun (client_socket, client_addr) ->
        match client_addr with
        | Lwt_unix.ADDR_INET (addr, _) ->
            (client_socket, Unix.string_of_inet_addr addr)
        | _ -> (client_socket, "Unknown"))
      !client_sockets

  (* Check the status of the server *)
  let status_server () =
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
