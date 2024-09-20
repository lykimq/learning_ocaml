open Ocaml_digestif_hash.File_integrity_sha256

let () =
  let file_to_check = "bin/example.txt" in
  let hash_store_file = "hash_store.txt" in

  (* Step 1: Generate hash for the file and save it *)
  let file_hash = FileIntegrityChecker.sha256_hash_file file_to_check in
  FileIntegrityChecker.save_hash file_hash hash_store_file;
  Printf.printf "File hash stored successfully.\n";

  (* Step 2: Verify the file integrity later *)
  if FileIntegrityChecker.verify_file_integrity file_to_check hash_store_file
  then Printf.printf "File integrity verified: No changes detected.\n"
  else Printf.printf "File integrity failed: File has been altered.\n"
