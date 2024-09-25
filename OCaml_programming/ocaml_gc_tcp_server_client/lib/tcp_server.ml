open Lwt.Infix

(* Max number of clients allowed to connect at once *)
let max_clients = 10
let connected_clients = ref 0

(* List to track active client sockets *)
let client_sockets = ref []

(* Handle each client connection, read their message, and response *)

let handle_client client_socket =
  let loop () =
    (* Read a line of input from the client, non-blocking *)
    Lwt_io.read_line_opt (Lwt_io.of_fd ~mode:Lwt_io.input client_socket)
    >>= function
    | None ->
        (* Remove the client from the list *)
        client_sockets :=
          List.filter
            (fun (socket, _) -> socket != client_socket)
            !client_sockets;
        (* Close the client socket *)
        Lwt_io.close (Lwt_io.of_fd ~mode:Lwt_io.input client_socket)
    | Some message_str ->
        let message = Messages.Message.decode_message message_str in
        Lwt_io.printf "Received_message: %s\n" message.payload >>= fun () ->
        let response_message =
          {
            message with
            msg_type = "Response";
            payload = "Echo: " ^ message.payload;
          }
        in
        let encoded_response =
          Messages.Message.encode_message response_message
        in
        (* Send the encoded response back to the client, writing the message
           over the socket *)
        Lwt_io.write_line
          (Lwt_io.of_fd ~mode:Lwt_io.output client_socket)
          encoded_response
  in
  loop ()

(* Server listens for incoming connections and process requests *)
let server_start () =
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
  Lwt_io.printf "Server started on localhost:8080\n" >>= fun () ->
  (* Define a recursive function to continuously accept client connections *)
  let rec accept_clients () =
    (* Accept incoming connection (blocks until a connection is made)*)
    Lwt_unix.accept server_socket >>= fun (client_socket, client_addr) ->
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
  accept_clients ()

(* Stop the server and close all connections *)
let stop_server server_socket =
  Lwt_io.printf "Stopping the server...\n" >>= fun () ->
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
  Lwt_io.printf "Server stopped.\n"

(* Check the status of the server *)
let status_server () =
  Lwt_io.printf "Server Status:\n" >>= fun () ->
  Lwt_io.printf "Active Connections: %d\n" (List.length !client_sockets)
  >>= fun () ->
  Lwt_list.iter_p
    (fun (_, client_addr) ->
      Lwt_io.printf "Client: %s\n"
        (Unix.string_of_inet_addr
           (match client_addr with
           | Lwt_unix.ADDR_INET (addr, _) -> addr
           | _ -> failwith "Invalid address")))
    !client_sockets
