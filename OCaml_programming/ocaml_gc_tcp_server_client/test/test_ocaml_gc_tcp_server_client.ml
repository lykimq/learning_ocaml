open Alcotest
open Ocaml_gc_tcp_server_client
open Lwt.Infix

(*NOTE: This is already invoked in
    [ocaml_digestif_hash/digital_signature_common.ml] before the [generate()]
    function. Calling it again in this test is unnecessary, and doing so would
    cause the test to fail. You only need to manually seed the RNG by providing
    entropy to Fortuna as follows: let () = Mirage_crypto_rng_lwt.initialize
    (module Mirage_crypto_rng.Fortuna)*)

(* Kill port while running test to prevent it is still running.
   [sudo kill -9 port]

   [sudo lsof -i :8080]
*)
let ip = "127.0.0.1"
let port = 0 (* The OS choose a random available port *)

let test_start_client_server () =
  Lwt_main.run
    ( Tcp_server.TCP_Server.start_server ~ip ~port () >>= fun server_socket ->
      (* Retrieve the port assigned to the server *)
      let server_address = Lwt_unix.getsockname server_socket in
      let port =
        match server_address with
        | Lwt_unix.ADDR_INET (_, port) -> port
        | _ -> failwith "Unexpected server address"
      in
      Tcp_client.TCP_Client.start_client ~ip ~port () >>= fun _ ->
      Tcp_server.TCP_Server.stop_server server_socket () >>= fun () ->
      Tcp_client.TCP_Client.stop_client () >>= fun () ->
      (* Ensure the client is stopped *)
      Lwt.return_unit )

let () =
  run "TCP Client-Server Tests"
    [
      ( "Client-Server",
        [ test_case "Client start" `Quick test_start_client_server ] );
    ]
