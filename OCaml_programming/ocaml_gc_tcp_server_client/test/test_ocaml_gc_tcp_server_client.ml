open Alcotest
open Ocaml_gc_tcp_server_client
open Lwt.Infix

(*NOTE: This is already invoked in
    [ocaml_digestif_hash/digital_signature_common.ml] before the [generate()]
    function. Calling it again in this test is unnecessary, and doing so would
    cause the test to fail. You only need to manually seed the RNG by providing
    entropy to Fortuna as follows: let () = Mirage_crypto_rng_lwt.initialize
    (module Mirage_crypto_rng.Fortuna)*)
let ip = "127.0.0.1"
let port = 8080

let test_server_start () =
  Lwt_main.run
    ( Tcp_server.TCP_Server.start_server ~ip ~port () >>= fun _ ->
      Lwt.return_unit )

let () =
  run "TCP Client-Server Tests"
    [
      ( "Client",
        [ (*test_case "Message sending" `Quick test_message_sending;
            test_case "Reconnection" `Quick test_reconnection;*) ] );
      ("Server", [ test_case "Server start" `Quick test_server_start ]);
    ]
