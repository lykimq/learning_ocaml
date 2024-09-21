open Ocaml_digestif_hash.Digital_signature_verifier_sha3_256
open Alcotest

(* Fatal Error: exeception Unseeded_generator, so for unix we generate RNG
   seeding *)
let () = Mirage_crypto_rng_unix.initialize (module Mirage_crypto_rng.Fortuna)

let test_generate_keys () =
  let private_key, public_key = DigitalSignatureVerifier.generate_keys () in
  check (option pass) "private key is generated" (Some private_key)
    (Some private_key);
  check (option pass) "public key is generated" (Some public_key)
    (Some public_key)

let test_hash_document () =
  let document = "Hello, world!" in
  let expected_hash = DigitalSignatureVerifier.hash_document document in
  check string "hash is correct length"
    (expected_hash |> String.length |> string_of_int)
    "32" (* SHA3_256 hash length *)

let test_sign_document () =
  let private_key, _ = DigitalSignatureVerifier.generate_keys () in
  let document = "Hello, world!" in
  let _hash, signature =
    DigitalSignatureVerifier.sign_document private_key document
  in
  check (option pass) "signature is generated" (Some signature) (Some signature)

let test_verify_signature () =
  let private_key, public_key = DigitalSignatureVerifier.generate_keys () in
  let document = "Hello, world!" in
  let _hash, signature =
    DigitalSignatureVerifier.sign_document private_key document
  in
  let result =
    DigitalSignatureVerifier.verify_signature public_key document signature
  in
  check bool "signature is valid" true result

let test_tampered_document () =
  let private_key, public_key = DigitalSignatureVerifier.generate_keys () in
  let document = "Hello, world!" in
  let _hash, signature =
    DigitalSignatureVerifier.sign_document private_key document
  in
  let tampered_document = "Goodbye, world!" in
  let result =
    DigitalSignatureVerifier.verify_signature public_key tampered_document
      signature
  in
  check bool "signature is invalid for tampered document" false result

let test_invalid_public_key () =
  let private_key, _public_key = DigitalSignatureVerifier.generate_keys () in
  let _, wrong_public_key = DigitalSignatureVerifier.generate_keys () in
  let document = "Hello, world!" in
  let _hash, signature =
    DigitalSignatureVerifier.sign_document private_key document
  in
  let result =
    DigitalSignatureVerifier.verify_signature wrong_public_key document
      signature
  in
  check bool "signature is invalid for wrong public key" false result

let () =
  run "Digitial Signature Verifier Tests"
    [
      ("Key generation", [ test_case "generate keys" `Quick test_generate_keys ]);
      ( "Document hashing",
        [ test_case "hash document" `Quick test_hash_document ] );
      ( "Signing and verification ",
        [
          test_case "sign document" `Quick test_sign_document;
          test_case "verify signature" `Quick test_verify_signature;
          test_case "tampered document" `Quick test_tampered_document;
          test_case "invalid public key" `Quick test_invalid_public_key;
        ] );
    ]
