open Ocaml_digestif_hash.Simple_blockchain_protocol_ripemd160
open Alcotest

(* Test 1: Create a genesis block and check its initial properties *)
let test_genesis_block () =
  let genesis_block = Blockchain.create_genesis_block () in
  check int "Genesis block index should be 0" 0 genesis_block.index;
  check string "Genesis block's previous hash should be '0'" "0"
    genesis_block.previous_hash;
  check bool "Genesis block hash should not be empty" true
    (String.length genesis_block.hash > 0)

let test_add_block () =
  let genesis_block = Blockchain.create_genesis_block () in
  let new_block = Blockchain.add_block genesis_block "Block 1 data" in
  check int "New block index should be 1" 1 new_block.index;
  check string "New block's previous hash should match genesis block's hash"
    genesis_block.hash new_block.previous_hash

(* Utility function to print block details *)
let print_block block =
  Printf.printf "Block #%d\n" block.index;
  Printf.printf "Previous Hash: %s\n" block.previous_hash;
  Printf.printf "Data: %s\n" block.data;
  Printf.printf "Timestamp: %f\n" block.timestamp;
  Printf.printf "Hash: %s\n" block.hash;
  Printf.printf "------------------------------------\n"

(* Print the entire blockchain *)
let print_blockchain blockchain = List.iter print_block blockchain

let test_valid_blockchain () =
  let genesis_block = Blockchain.create_genesis_block () in
  Unix.sleep 1;
  let block1 = Blockchain.add_block genesis_block "Block 1 data" in
  Unix.sleep 1;
  (* Ensure enough time passes to have a different timestamp *)
  let block2 = Blockchain.add_block block1 "Block 2 data" in
  Unix.sleep 1;
  let blockchain = [ genesis_block; block1; block2 ] in
  (* Debug *)
  print_blockchain blockchain;
  check bool "Blockchain should be valid" true
    (Blockchain.verify_chain blockchain)

let test_tempered_blockchain () =
  let genesis_block = Blockchain.create_genesis_block () in
  (* Simulate time difference for realistic timestamps *)
  Unix.sleep 1;
  let block1 = Blockchain.add_block genesis_block "Block 1 data" in
  Unix.sleep 1;
  (* Ensure that block1 is added into the blockchain *)
  let blockchain_with_block1 = [ genesis_block; block1 ] in
  (* Debug *)
  List.iter
    (fun block ->
      Printf.printf "Block #%d, Hash: %s, Previous Hash: %s, Data: %s\n"
        block.index block.hash block.previous_hash block.data)
    blockchain_with_block1;
  (* Print the blockchain to check that block1 is correctly added *)
  Printf.printf "Before tampering:\n";

  let tempered_block =
    {
      index = block1.index;
      previous_hash = block1.previous_hash;
      data = "Tampered data";
      (* Change the data to simulate tampering *)
      hash =
        Blockchain.calculate_hash block1.index block1.previous_hash
          "Tampered data" block1.timestamp;
      (* Recalculate hash after tampering *)
      timestamp = block1.timestamp;
    }
  in
  Unix.sleep 1;

  let block2 = Blockchain.add_block tempered_block "Block 2 data" in
  Unix.sleep 1;
  (* Added the tempered block and block2 in the previous blockchain *)
  let blockchain = blockchain_with_block1 @ [ tempered_block; block2 ] in
  (* Debug: Print out the blockchain to ensure all blocks are included *)
  Printf.printf "After tampering:\n";
  List.iter
    (fun block ->
      Printf.printf "Block #%d, Hash: %s, Previous Hash: %s, Data: %s\n"
        block.index block.hash block.previous_hash block.data)
    blockchain;

  Alcotest.check Alcotest.bool "Tempered blockchain should be invalid" false
    (Blockchain.verify_chain blockchain)

let blockchain_tests () =
  [
    test_case "Create genesis block" `Quick test_genesis_block;
    test_case "Add block" `Quick test_add_block;
    test_case "Valid blockchain" `Quick test_valid_blockchain;
    test_case "Tempered blockchain" `Quick test_tempered_blockchain;
  ]

let () =
  run "Blockchain Protocol Tests" [ ("Blockchain Tests", blockchain_tests ()) ]
