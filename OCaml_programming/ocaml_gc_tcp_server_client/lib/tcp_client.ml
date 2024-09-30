open Lwt.Infix
open Ocaml_digestif_hash.Digital_signature_common

module TCP_Client : sig
  val client_connect : ip:string -> port:int -> unit Lwt.t
  val client_disconnect : unit -> unit Lwt.t
  val client_send_message : string -> unit Lwt.t
  val client_status : unit -> unit Lwt.t
end = struct
  (* Client private key for signing messages *)
  let client_private_key, client_public_key =
    Digital_signature_common.generate_keys ()

  (* Socket for client connection *)
  let client_socket = ref None
  let server_public_key = ref None

  (* Store IP and port information *)
  let stored_ip = ref None
  let stored_port = ref None

  (* Shutdown flag *)
  let shutdown_flag = ref false

  (* Maximum number of reconnection attempts *)
  let max_reconnect_attempts = 5

  (* Delay between reconnection attempts in seconds *)
  let reconnect_delay = 2.0

  (* Log helper function *)
  let log msg = Lwt_io.printf "[CLIENT] %s\n" msg

  let client_handshake socket =
    let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input socket in
    let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output socket in
    Lwt.catch
      (fun () ->
        (* Send client's public key to the server *)
        let client_public_key_str =
          Mirage_crypto_ec.Ed25519.pub_to_octets client_public_key
        in
        Lwt_io.write_line output_channel client_public_key_str >>= fun () ->
        log "Send client public key to server." >>= fun () ->
        (* Receive the server's public key *)
        Lwt_io.read_line_opt input_channel >>= function
        | None -> Lwt.fail_with "Handshake failed: Server disconnected"
        | Some server_public_key_str -> (
            match
              Mirage_crypto_ec.Ed25519.pub_of_octets server_public_key_str
            with
            | Ok pub_key ->
                server_public_key := Some pub_key;
                log "Received and stored server public key.\n"
            | Error _ -> Lwt.fail_with "Failed to deserialize server public key"
            ))
      (fun exn ->
        raise
          (Errors.ConnectionError
             ("Error during handshake: " ^ Printexc.to_string exn)))

  (* Open a connection to the server *)
  let client_connect ~ip ~port =
    (* Reset shutdown flag on new connection *)
    shutdown_flag := false;
    let socket = Lwt_unix.socket PF_INET SOCK_STREAM 0 in
    let addr = Lwt_unix.ADDR_INET (Unix.inet_addr_of_string ip, port) in
    Lwt.catch
      (fun () ->
        Lwt_unix.connect socket addr >>= fun () ->
        (* Perform the handshake to receive the server's public key *)
        client_handshake socket >>= fun () ->
        (* Store the connected socket *)
        client_socket := Some socket;
        stored_ip := Some ip;
        stored_port := Some port;
        log (Printf.sprintf "Connected to server at %s:%d\n" ip port))
      (fun exn ->
        raise
          (Errors.ConnectionError
             ("Failed to connect to server: " ^ Printexc.to_string exn)))

  (* Reconnect logic *)
  let reconnect ~attempts =
    match (!stored_ip, !stored_port) with
    | Some ip, Some port ->
        log "Attempting to reconnect..." >>= fun () ->
        let rec try_reconnect attempt =
          if attempts > max_reconnect_attempts || !shutdown_flag then
            raise (Errors.ConnectionError "Max reconnection attempts reached.")
          else
            log (Printf.sprintf "Reconnection attempt %d" attempt) >>= fun () ->
            Lwt_unix.sleep reconnect_delay >>= fun () ->
            Lwt.catch
              (fun () -> client_connect ~ip ~port)
              (fun exn ->
                log ("Reconnection attempt failed: " ^ Printexc.to_string exn)
                >>= fun () -> try_reconnect (attempt + 1))
        in
        try_reconnect 1
    | _ ->
        raise
          (Errors.ConnectionError "No previous connection info to reconnect.")

  (* Send a secure request to the server *)
  let client_send_message payload =
    let open Messages.Message in
    (* Log the current connection status before sending a message *)
    if !shutdown_flag then Lwt.fail_with "Client is shutting down."
    else
      match !client_socket with
      | None -> raise (Errors.ConnectionError "Client is not connected")
      | Some socket ->
          (let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output socket in
           let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input socket in
           (* Create the message *)
           let message =
             {
               msg_type = Request;
               payload;
               timestamp = string_of_float (Unix.time ());
               hash = "";
               signature = None;
             }
           in
           let message_hash =
             Messages.Message.hash_message
               (module Messages.Message.Blak2b)
               message
           in
           let message_with_hash =
             { message with Messages.Message.hash = message_hash }
           in
           (* Check if the message is of type [Critical]. If it is, sign it *)
           let message_to_send =
             match message_with_hash.msg_type with
             | Critical ->
                 Messages.Message.sign_message
                   (module Messages.Message.Blak2b)
                   client_private_key message_with_hash
             | _ -> message_with_hash
           in
           (* Encode and send the message to the server *)
           let encode_message =
             Messages.Message.encode_message message_to_send
           in
           Lwt.catch (fun () ->
               Lwt_io.write_line output_channel encode_message >>= fun () ->
               Lwt_io.printf "Message sent to server: %s\n" payload
               >>= fun () ->
               (* Wait for the response from the server *)
               Lwt_io.read_line_opt input_channel >>= function
               | None ->
                   log "Server closed the connection unexpectedly."
                   >>= fun () ->
                   (* Attempt to reconnect *)
                   reconnect ~attempts:max_reconnect_attempts >>= fun () ->
                   raise (Errors.TimeoutError "Server closed the connection.")
               | Some response_str -> (
                   let response_message =
                     Messages.Message.decode_message response_str
                   in
                   (* Verify the server's response *)
                   let expected_hash =
                     Messages.Message.hash_message
                       (module Messages.Message.Blak2b)
                       response_message
                   in
                   if response_message.hash <> expected_hash then
                     raise
                       (Errors.MessageError "Response hash verification failed.")
                   else
                     (* Optionally verify the signature if it is present *)
                     match response_message.signature with
                     | Some _ -> (
                         match !server_public_key with
                         | Some pub_key ->
                             if
                               Messages.Message.verify_signature
                                 (module Messages.Message.Blak2b)
                                 pub_key response_message
                             then
                               log
                                 (Printf.sprintf "Server response: %s\n"
                                    response_message.payload)
                             else
                               raise
                                 (Errors.MessageError
                                    "Server signature verification failed.")
                         | None ->
                             raise
                               (Errors.MessageError
                                  "Server public key not available for \
                                   verification"))
                     | None ->
                         log
                           ("Server response (unsigned): %s\n"
                          ^ response_message.payload)))) (fun exn ->
              log ("Error during communication: " ^ Printexc.to_string exn)
              >>= fun () ->
              (* Attemp to reconnect*)
              reconnect ~attempts:max_reconnect_attempts >>= fun () ->
              raise
                (Errors.ConnectionError
                   ("Communication error: " ^ Printexc.to_string exn)))

  (* Graceful shutdown function *)
  let client_disconnect () =
    shutdown_flag := true;
    match !client_socket with
    | None -> log "Client is already disconnected."
    | Some socket ->
        log "Disconnecting from server..." >>= fun () ->
        Lwt.catch
          (fun () ->
            Lwt_unix.close socket >>= fun () ->
            client_socket := None;
            log "Disconnected successfully.")
          (fun exn ->
            client_socket := None;
            log ("Error during disconnect: " ^ Printexc.to_string exn))

  (* Client status: check if connected and show IP/PORT info *)
  let client_status () =
    match !client_socket with
    | None -> log "Client is not connected."
    | Some _ -> (
        match (!stored_ip, !stored_port) with
        | Some ip, Some port ->
            log (Printf.sprintf "Client is connected: %s:%d" ip port)
        | _ -> log "Client is connected but IP/PORT details are unavailable.")
end
