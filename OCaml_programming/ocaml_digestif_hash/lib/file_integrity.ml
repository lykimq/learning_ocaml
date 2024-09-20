open Digestif

(* File integrity goal is to hash a file's contents, store the hash, and later
   verify if the file has been tampered with.
   Module for reading and hashing file contents *)
module FileIntegrityChecker : sig
  val sha256_hash_file : string -> SHA256.t
  val hash_to_hex : SHA256.t -> string
  val save_hash : SHA256.t -> string -> unit
  val read_stored_hash : string -> string
  val verify_file_integrity : string -> string -> bool
end = struct
  (* Hash a file using SHA256, as it's widely used and secure. *)
  let sha256_hash_file filename =
    (* Open the file in binary mode *)
    let ic = open_in_bin filename in
    (* Process the file in chunks of 4KB *)
    let buffer_size = 4096 in

    (* Read and hash file content *)
    let rec hash_file channel ctx =
      let buffer = Bytes.create buffer_size in
      match input channel buffer 0 buffer_size with
      | 0 -> ctx (* end of file, return the hash context *)
      | n ->
          (* Update the hash content with the current chunk *)
          let ctx = SHA256.feed_bytes ctx (Bytes.sub buffer 0 n) in
          (* Call the next chunk *)
          hash_file channel ctx
    in
    (* Initialize SHA256 context and process the file *)
    let ctx = SHA256.init () in
    let ctx = hash_file ic ctx in
    (* Close the file *)
    close_in ic;
    (* Return the final hash as a digest *)
    SHA256.get ctx

  (* Convert the digest to a hexadecimal string *)
  let hash_to_hex hash = SHA256.to_hex hash

  (* Save the hash to a file *)
  let save_hash hash filename =
    let oc = open_out filename in
    output_string oc (hash_to_hex hash);
    close_out oc

  (* Read a stored hash from a file *)
  let read_stored_hash filename =
    let ic = open_in filename in
    let hash = input_line ic in
    close_in ic;
    hash

  (* Verify file integrity by comparing current and stored hashes *)
  let verify_file_integrity filename hash_filename =
    let current_hash = hash_to_hex (sha256_hash_file filename) in
    let stored_hash = read_stored_hash hash_filename in
    current_hash = stored_hash
end
