open Lwt.Infix
open Ocaml_digestif_hash.Digital_signature_common

module TCP_Client : sig
  val start_client : ip:string -> port:int -> unit -> unit Lwt.t

  val client_send_message :
    msg_type:Messages.Message.msg_type -> string -> unit Lwt.t

  val stop_client : unit -> unit Lwt.t
  val client_status : unit -> unit Lwt.t
end = struct
  (* Client private key for signing messages *)
  let client_private_key, client_public_key =
    Digital_signature_common.generate_keys ()

  (* Socket and channels for client connection *)
  let client_socket = ref None
  let input_channel = ref None
  let output_channel = ref None
  let server_public_key = ref None

  (* Store IP and port information *)
  let stored_ip = ref None
  let stored_port = ref None

  (* Shutdown flag *)
  let shutdown_flag = ref false

  (* Maximum number of reconnection attempts *)
  let max_reconnect_attempts = 5

  (* Delay between reconnection attempts in seconds *)
  let reconnect_delay = 1.5
  let log_attempt level msg = Logs.log_to_console_and_file level msg

  (* Clean up client socket and resources after disconnected *)
  let cleanup_resources () =
    let close_channel channel =
      match !channel with
      | None -> Lwt.return_unit
      | Some chn -> Lwt_io.close chn >>= fun () -> Lwt.return (channel := None)
    in
    let close_socket () =
      match !client_socket with
      | None -> Lwt.return_unit
      | Some socket ->
          Lwt_unix.close socket >>= fun () ->
          client_socket := None;
          log_attempt Logs.Level.INFO
            "Client socket closed and resources cleaned up."
    in
    close_channel input_channel >>= fun () ->
    close_channel output_channel >>= fun () ->
    close_socket () >>= fun () ->
    log_attempt Logs.Level.INFO
      "Client socket and channels closed and resources cleaned up."

  let client_handshake ?(attempts = 3) socket =
    (* Add shutdown_flag check *)
    let in_channel = Lwt_io.of_fd ~mode:Lwt_io.input socket in
    let out_channel = Lwt_io.of_fd ~mode:Lwt_io.output socket in
    let rec attempts_handshake remaining_attempts =
      if remaining_attempts = 0 || !shutdown_flag then
        Lwt.fail_with "Handshake failed after maximum attempts."
      else
        Lwt.catch
          (fun () ->
            (* Send client's public key to the server *)
            let client_public_key_str =
              Mirage_crypto_ec.Ed25519.pub_to_octets client_public_key
            in
            Lwt_io.write_line out_channel client_public_key_str >>= fun () ->
            log_attempt Logs.Level.INFO "Send client public key to server."
            >>= fun () ->
            (* Receive the server's public key *)
            Lwt_io.read_line_opt in_channel >>= function
            | None ->
                log_attempt Logs.Level.ERROR
                  "Handshake failed: Server disconnected"
                >>= fun () ->
                (*cleanup_resources () >>= fun () ->*)
                Lwt.fail_with "Handshake failed: Server disconnected."
            | Some server_public_key_str -> (
                match
                  Mirage_crypto_ec.Ed25519.pub_of_octets server_public_key_str
                with
                | Ok pub_key ->
                    server_public_key := Some pub_key;
                    log_attempt Logs.Level.INFO
                      "Received and stored server public key.\n"
                | Error _ ->
                    log_attempt Logs.Level.ERROR
                      "Handshake failed: Incorrect public key format"
                    >>= fun () ->
                    (* Unrecoverable, incorrect format, cleanup resources *)
                    cleanup_resources () >>= fun () ->
                    Lwt.fail_with
                      "Handshake failed: Incorrect public key format"))
          (fun exn ->
            log_attempt Logs.Level.ERROR
              ("Error during handshake: " ^ Printexc.to_string exn)
            >>= fun () ->
            log_attempt Logs.Level.INFO "Retrying handshake..." >>= fun () ->
            Lwt_unix.sleep 1.0 >>= fun () ->
            attempts_handshake (remaining_attempts - 1))
    in
    attempts_handshake attempts

  (* Open a connection to the server *)
  let start_client ~ip ~port () =
    if !shutdown_flag then
      log_attempt Logs.Level.ERROR "Client is shutting down, cannot start."
      >>= fun () -> Lwt.fail_with "Client is shutting down, cannot start."
    else
      log_attempt Logs.Level.INFO
        (Printf.sprintf "Attempting to connect to server at %s:%d" ip port)
      >>= fun () ->
      (* Reset shutdown flag on new connection *)
      shutdown_flag := false;
      let socket = Lwt_unix.socket PF_INET SOCK_STREAM 0 in
      let addr = Lwt_unix.ADDR_INET (Unix.inet_addr_of_string ip, port) in
      Lwt.catch
        (fun () ->
          Lwt_unix.connect socket addr >>= fun () ->
          (* Perform the handshake to receive the server's public key *)
          client_handshake ~attempts:3 socket >>= fun () ->
          (* Store the connected socket *)
          client_socket := Some socket;
          stored_ip := Some ip;
          stored_port := Some port;
          log_attempt Logs.Level.INFO
            (Printf.sprintf "Connected to server at %s:%d\n" ip port))
        (fun exn ->
          log_attempt Logs.Level.ERROR
            ("Failed to connect to server: " ^ Printexc.to_string exn)
          >>= fun () ->
          cleanup_resources () >>= fun () ->
          Lwt.fail
            (Errors.ConnectionError
               ("Failed to connect to server: " ^ Printexc.to_string exn)))

  (* Reconnect logic *)
  let reconnect ~attempts =
    if !shutdown_flag then
      log_attempt Logs.Level.ERROR "Client is shutting down, reconnect aborted."
      >>= fun () -> Lwt.fail_with "Client is shutting down."
    else
      log_attempt Logs.Level.INFO "Reconnection attempt started" >>= fun () ->
      match (!stored_ip, !stored_port) with
      | Some ip, Some port ->
          log_attempt Logs.Level.INFO "Attempting to reconnect..." >>= fun () ->
          let rec try_reconnect attempt =
            if attempts > max_reconnect_attempts || !shutdown_flag then
              log_attempt Logs.Level.ERROR
                (Printf.sprintf "Reconnection attempt %d" attempt)
              >>= fun () ->
              (*cleanup_resources () >>= fun () ->*)
              Lwt.fail
                (Errors.ConnectionError "Max reconnection attempts reached.")
            else
              log_attempt Logs.Level.INFO
                (Printf.sprintf "Reconnection attempt %d" attempt)
              >>= fun () ->
              Lwt_unix.sleep reconnect_delay >>= fun () ->
              Lwt.catch
                (fun () -> start_client ~ip ~port ())
                (fun exn ->
                  log_attempt Logs.Level.ERROR
                    ("Reconnection attempt failed: " ^ Printexc.to_string exn)
                  >>= fun () -> try_reconnect (attempt + 1))
          in
          try_reconnect 1
      | _ ->
          log_attempt Logs.Level.ERROR
            "No previous connection info to reconnect."
          >>= fun () ->
          cleanup_resources () >>= fun () ->
          Lwt.fail
            (Errors.ConnectionError "No previous connection info to reconnect.")

  (* Send a secure request to the server *)

  let create_message ~msg_type ~payload =
    let open Messages.Message in
    let message =
      {
        msg_type;
        payload;
        timestamp = string_of_float (Unix.time ());
        hash = "";
        signature = None;
      }
    in
    let message_hash = hash_message (module Blak2b) message in
    { message with hash = message_hash }

  (* Sign the message if it is of type Critical *)
  let sign_if_critical message =
    let open Messages.Message in
    match message.msg_type with
    | Critical -> sign_message (module Blak2b) client_private_key message
    | _ -> message

  (* Encoding and send the message to the server *)
  let send_message_to_server ~output_channel message =
    let encoded_message = Messages.Message.encode_message message in
    Lwt_io.write_line output_channel encoded_message >>= fun () ->
    log_attempt Logs.Level.INFO
      (Printf.sprintf "Message of type %s sent to sever: %s\n"
         (Messages.Message.string_of_msg_type message.msg_type)
         message.payload)

  (* Handle the server's response and verify the hash and signature *)
  let handle_server_response ~input_channel =
    Lwt_io.read_line_opt input_channel >>= function
    | None ->
        log_attempt Logs.Level.ERROR
          "Server closed the connection unexpectedly."
        >>= fun () ->
        (*cleanup_resources () >>= fun () ->*)
        Lwt.fail (Errors.TimeoutError "Server closed the connection.")
    | Some response_str -> (
        let response_message = Messages.Message.decode_message response_str in
        (* Verify the server's reponse *)
        let expected_hash =
          Messages.Message.hash_message
            (module Messages.Message.Blak2b)
            response_message
        in
        if response_message.hash <> expected_hash then
          log_attempt Logs.Level.ERROR "Response hash veryfication failed."
          >>= fun () ->
          (*cleanup_resources () >>= fun () ->*)
          Lwt.fail (Errors.MessageError "Response hash verification failed.")
        else
          match response_message.signature with
          | Some _ -> (
              match !server_public_key with
              | Some pub_key ->
                  if
                    Messages.Message.verify_signature
                      (module Messages.Message.Blak2b)
                      pub_key response_message
                  then
                    log_attempt Logs.Level.INFO
                      (Printf.sprintf "Server response: %s\n"
                         response_message.payload)
                  else
                    log_attempt Logs.Level.ERROR
                      "Server signature verificaiton failed."
                    >>= fun () ->
                    (*cleanup_resources () >>= fun () ->*)
                    Lwt.fail
                      (Errors.MessageError
                         "Server signature verification failed.")
              | None ->
                  log_attempt Logs.Level.ERROR
                    "Server public key not available for verification"
                  >>= fun () ->
                  (*cleanup_resources () >>= fun () ->*)
                  Lwt.fail
                    (Errors.MessageError
                       "Server public key not available for verification"))
          | None ->
              log_attempt Logs.Level.INFO
                (Printf.sprintf "Server response (unsigned): %s\n"
                   response_message.payload))

  let client_send_message ~msg_type payload =
    if !shutdown_flag then
      log_attempt Logs.Level.ERROR "Client is shutting down." >>= fun () ->
      Lwt.fail_with "Client is shutting down."
    else
      log_attempt Logs.Level.DEBUG
        (Printf.sprintf "Preparing to send message of type %s"
           (Messages.Message.string_of_msg_type msg_type))
      >>= fun () ->
      if !shutdown_flag then
        log_attempt Logs.Level.ERROR "Client is shutting down." >>= fun () ->
        Lwt.fail_with "Client is shutting down."
      else
        (* If client socket is None, attempt to reconnect *)
        let ensure_connection () =
          match !client_socket with
          | None -> (
              log_attempt Logs.Level.INFO
                "No active connection. Attempting to reconnect..."
              >>= fun () ->
              reconnect ~attempts:max_reconnect_attempts >>= fun () ->
              (* After reconnection attempt, recheck if connection is successful. *)
              match !client_socket with
              | None ->
                  log_attempt Logs.Level.ERROR "Client is not connected"
                  >>= fun () ->
                  (*cleanup_resources () >>= fun () ->*)
                  Lwt.fail (Errors.ConnectionError "Client is not connected")
              | Some _ -> Lwt.return_unit)
          | Some _ -> Lwt.return_unit
        in
        ensure_connection () >>= fun () ->
        match !client_socket with
        | None ->
            log_attempt Logs.Level.ERROR
              "Client is not connected even after reconnect"
            >>= fun () ->
            (*cleanup_resources () >>= fun () ->*)
            Lwt.fail
              (Errors.ConnectionError
                 "Client is not connected even after reconnection attempt.")
        | Some socket ->
            let output_channel = Lwt_io.of_fd ~mode:Lwt_io.output socket in
            let input_channel = Lwt_io.of_fd ~mode:Lwt_io.input socket in
            (* Create, sign if necessary and send the message *)
            let message = create_message ~msg_type ~payload in
            let message_to_send = sign_if_critical message in
            let timeout_duration = 10.0 (* second *) in
            Lwt.catch
              (fun () ->
                Lwt_unix.with_timeout timeout_duration (fun () ->
                    send_message_to_server ~output_channel message_to_send
                    >>= fun () -> handle_server_response ~input_channel))
              (fun exn ->
                log_attempt Logs.Level.ERROR
                  ("Error during communcation or timeout: "
                 ^ Printexc.to_string exn)
                >>= fun () ->
                cleanup_resources () >>= fun () ->
                (* Using Lwt.fail for handling errors in asynchronous, [raise] is used
                   for synchronous code *)
                Lwt.fail
                  (Errors.ConnectionError
                     ("Communication or timeout error: "
                    ^ Printexc.to_string exn)))

  (* Graceful shutdown function *)
  let stop_client () =
    log_attempt Logs.Level.INFO "Disconnecting client" >>= fun () ->
    shutdown_flag := true;
    (*cleanup_resources () >>= fun () ->*)
    match !client_socket with
    | None -> log_attempt Logs.Level.INFO "Client is already disconnected."
    | Some socket ->
        log_attempt Logs.Level.INFO "Disconnecting from server..." >>= fun () ->
        Lwt.catch
          (fun () ->
            Lwt_unix.close socket >>= fun () ->
            client_socket := None;
            log_attempt Logs.Level.INFO "Disconnected successfully.")
          (fun exn ->
            client_socket := None;
            log_attempt Logs.Level.ERROR
              ("Error during disconnect: " ^ Printexc.to_string exn))

  (* Client status: check if connected and show IP/PORT info *)
  let client_status () =
    match !client_socket with
    | None -> log_attempt Logs.Level.INFO "Client is not connected."
    | Some _ -> (
        match (!stored_ip, !stored_port) with
        | Some ip, Some port ->
            log_attempt Logs.Level.INFO
              (Printf.sprintf "Client is connected: %s:%d" ip port)
        | _ ->
            log_attempt Logs.Level.INFO
              "Client is connected but IP/PORT details are unavailable.")
end
