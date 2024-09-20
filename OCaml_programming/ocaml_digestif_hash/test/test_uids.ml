open Ocaml_digestif_hash.Uids
open Alcotest

let test_generate_uid () =
  let data = "user@example.com" in
  let uid = UniqueIdentifier.generate_uid data in
  check bool "UID should not be empty" true (String.length uid > 0)

let test_consistent_uid_generation () =
  let data = "user@example.com" in
  let uid1 = UniqueIdentifier.generate_uid data in
  let uid2 = UniqueIdentifier.generate_uid data in
  check string "Hashing the same data twice should give the same UID" uid1 uid2

let test_different_data_different_uids () =
  let data1 = "user@example.com" in
  let data2 = "file1.txt: 10KB, created 2024-09-20" in
  let uid1 = UniqueIdentifier.generate_uid data1 in
  let uid2 = UniqueIdentifier.generate_uid data2 in
  check bool "Different data should generate different UIDs" false
    (String.equal uid1 uid2)

let test_verify_correct_uid () =
  let data = "user@example.com" in
  let uid = UniqueIdentifier.generate_uid data in
  let result = UniqueIdentifier.verify_uid data uid in
  check bool "Correct data-UID pair should verify successfully" true result

let test_verify_incorrect_uid () =
  let data = "user@example.com" in
  let uid = UniqueIdentifier.generate_uid data in
  let wrong_data = "wrong@example.com" in
  let result = UniqueIdentifier.verify_uid wrong_data uid in
  check bool "Incorrect data-UID pair should fail verification" false result

let test_empty_data_uid () =
  let empty_data = "" in
  let uid = UniqueIdentifier.generate_uid empty_data in
  check bool "UID for empty data should not be empty" true
    (String.length uid > 0);
  let result = UniqueIdentifier.verify_uid "" uid in
  check bool "Empty data should verify successfully with its own UID" true
    result

let test_uid_generation () =
  [
    test_case "Generate UID for data" `Quick test_generate_uid;
    test_case "Consistent UID generation" `Quick test_consistent_uid_generation;
    test_case "Different data different UIDs" `Quick
      test_different_data_different_uids;
    test_case "Verify correct UID" `Quick test_verify_correct_uid;
    test_case "Verify incorrect UID" `Quick test_verify_incorrect_uid;
    test_case "Hashing and verifying empty data" `Quick test_empty_data_uid;
  ]

let () =
  run "UniqueIdentifier" [ ("UID Generation Testse", test_uid_generation ()) ]
