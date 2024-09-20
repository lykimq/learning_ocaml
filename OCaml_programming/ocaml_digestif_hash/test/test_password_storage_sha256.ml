open Ocaml_digestif_hash.Password_storage_sha256
open Alcotest

let test_hash_password () =
  let password = "my_secure_password" in
  let hashed_password = PasswordStorage.hash_password password in
  check bool "Hashed password should not be empty" true
    (String.length hashed_password > 0)

let test_verify_correct_password () =
  let password = "my_secure_password" in
  let hashed_password = PasswordStorage.hash_password password in
  let result = PasswordStorage.verify_password password hashed_password in
  check bool "Password verification should succeed" true result

let test_verify_wrong_password () =
  let password = "my_secure_password" in
  let hashed_password = PasswordStorage.hash_password password in
  let wrong_password = "wrong_password" in
  let result = PasswordStorage.verify_password wrong_password hashed_password in
  check bool "Password verification should fail with wrong password" false
    result

let test_empty_password () =
  let empty_password = "" in
  let hashed_empty = PasswordStorage.hash_password empty_password in
  check bool "Hash of empty password should not be empty" true
    (String.length hashed_empty > 0)

let test_consistent_hashing () =
  let password = "my_secure_password" in
  let hashed1 = PasswordStorage.hash_password password in
  let hashed2 = PasswordStorage.hash_password password in
  check string "Hashing the same password twice should give the same result "
    hashed1 hashed2

let test_different_password () =
  let password1 = "password_one" in
  let password2 = "password_two" in
  let hashed1 = PasswordStorage.hash_password password1 in
  let hashed2 = PasswordStorage.hash_password password2 in
  check bool "Different passwords should produce different hashes" false
    (String.equal hashed1 hashed2)

let test_cases () =
  [
    test_case "Basic password hashing" `Quick test_hash_password;
    test_case "Verify correct password" `Quick test_verify_correct_password;
    test_case "Verify wrong password" `Quick test_verify_wrong_password;
    test_case "Empty password" `Quick test_empty_password;
    test_case "Consistent hashing" `Quick test_consistent_hashing;
    test_case "Different password" `Quick test_different_password;
  ]

let () = run "Password Storage" [ ("Password Storage Tests", test_cases ()) ]
