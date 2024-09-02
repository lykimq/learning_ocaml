open File_system.File_system_simple_balance
open Alcotest
open File_System_Simple_Balance

let sample_file name content = { name; content }
let sample_dir name children = Directory { name; children }

let test_calculate_depth () =
  let file1 = File (sample_file "file1.txt" "content_1") in
  let file2 = File (sample_file "file2.txt" "content_2") in
  let subdir = sample_dir "subdir" [ file1; file2 ] in
  let dir = sample_dir "root" [ subdir ] in
  check int "Depth of root directory with subdir" 2 (calculate_depth dir);
  check int "Depth of subdir" 1 (calculate_depth subdir);
  check int "Depth of file" 0 (calculate_depth file1)

let test_add_file_balanced () =
  let file1 = sample_file "file1.txt" "content_1" in
  let file2 = sample_file "file2.txt" "content_2" in
  let file3 = sample_file "file3.txt" "content_3" in
  let file4 = sample_file "file4.txt" "content_4" in
  let file5 = sample_file "file5.txt" "content_5" in
  let file6 = sample_file "file6.txt" "content_6" in
  let file7 = sample_file "file7.txt" "content_7" in
  (*
   Add files to the directory *)
  let empty_dir = sample_dir "root" [] in
  let dir = add_file_balanced empty_dir file1 in
  let dir = add_file_balanced dir file2 in
  let dir = add_file_balanced dir file3 in
  let dir = add_file_balanced dir file4 in
  let dir = add_file_balanced dir file5 in
  let dir = add_file_balanced dir file6 in
  let depth = calculate_depth dir in
  check int "Depth after 6 files" 1 depth;

  (* At this point, adding one more file should trigger rebalancing *)
  let dir = add_file_balanced dir file7 in
  let depth = calculate_depth dir in
  check int "Depth after 7 files" 2 depth

let test_find_directory () =
  let file1 = File (sample_file "file1.txt" "content_1") in
  let subdir = sample_dir "subdir" [ file1 ] in
  let root = sample_dir "root" [ subdir ] in
  let found = find_directory [ "subdir" ] root in
  check
    (option
       (of_pp (fun fmt d ->
            Format.fprintf fmt "%s"
              (match d with Directory d -> d.name | _ -> "File"))))
    "Found subdir" (Some subdir) found;

  let not_found = find_directory [ "nonexist" ] root in
  check (option (of_pp (fun _ _ -> ()))) "Not found" None not_found

let test_remove_node () =
  let file1 = File (sample_file "file1.txt" "content_1") in
  let file2 = File (sample_file "file2.txt" "content_2") in
  let subdir = sample_dir "subdir" [ file1; file2 ] in
  let root = sample_dir "root" [ subdir ] in
  let root_after_remove = remove_node "file2.txt" root in
  let expected_subdir = sample_dir "subdir" [ file1 ] in
  let expected_children = [ expected_subdir ] in
  match root_after_remove with
  | File _ -> fail "Unexpected result"
  | Directory d ->
      check
        (list
           (of_pp (fun fmt n ->
                match n with
                | File f -> Format.fprintf fmt "File: %s" f.name
                | Directory d -> Format.fprintf fmt "Directory: %s" d.name)))
        "Root children after remove file2" expected_children d.children

let test_print_filesystem () =
  let file1 = File (sample_file "file1.txt" "content_1") in
  let subdir = sample_dir "subdir" [ file1 ] in
  let root = sample_dir "root" [ subdir ] in
  print_filesystem root ""

let tests =
  [
    test_case "add_file" `Quick test_add_file_balanced;
    test_case "calculate depth" `Quick test_calculate_depth;
    test_case "find directory" `Quick test_find_directory;
    test_case "remove directory" `Quick test_remove_node;
    test_case "print file system" `Quick test_print_filesystem;
  ]

let () = run "File System Simple Balance" [ ("File Directory Balance", tests) ]
