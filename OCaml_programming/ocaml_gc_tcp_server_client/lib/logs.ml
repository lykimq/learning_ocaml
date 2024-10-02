open Lwt.Infix

module Level = struct
  type t = INFO | ERROR | DEBUG

  let to_string = function
    | INFO -> "INFO"
    | ERROR -> "ERROR"
    | DEBUG -> "DEBUG"
end

let log_file = ref None

(* Set max log size to 1MB *)
let max_log_size = ref (1024 * 1024)
let log_path = ref "client_server.log"

(* Initialize log file, if neccessary *)
let init_log ?(log_path_init = "client_server.log") ?(max_size = 1024 * 1024) ()
    =
  log_path := log_path_init;
  max_log_size := max_size;
  match !log_file with
  | Some _ ->
      (* Already initialized *)
      ()
  | None ->
      let oc = open_out_gen [ Open_creat; Open_append ] 0o664 !log_path in
      log_file := Some oc

let close_log () =
  match !log_file with
  | Some oc ->
      close_out oc;
      log_file := None
  | None -> ()

(* Rotate log file when reaching max size *)
let rotate_log () =
  match !log_file with
  | Some oc ->
      close_out oc;
      (* Rename the current log file to log_path.1 (or .old)*)
      let rotated_log = !log_path ^ ".1" in
      Sys.rename !log_path rotated_log;
      (* Create a new log file *)
      let new_oc = open_out_gen [ Open_creat; Open_append ] 0o664 !log_path in
      log_file := Some new_oc
  | None -> ()

(* Check if the log file needs rotation before writing to it *)
let check_log_rotation () =
  match !log_file with
  | Some oc ->
      let log_stats = Unix.fstat (Unix.descr_of_out_channel oc) in
      if log_stats.Unix.st_size >= !max_log_size then rotate_log ()
  | None -> ()

(* Helper function to log both file and console *)
let log_to_console_and_file level msg =
  let timestamp =
    Unix.time () |> Unix.gmtime |> fun t ->
    Printf.sprintf "%04d-%02d-%02d %02d:%02d:%02d" (t.tm_year + 1900)
      (t.tm_mon + 1) t.tm_mday t.tm_hour t.tm_min t.tm_sec
  in
  let full_msg =
    Printf.sprintf "[%s] [%s] %s\n" timestamp (Level.to_string level) msg
  in

  (* Print to console *)
  Lwt_io.print full_msg >>= fun () ->
  (* Check if log rotation is needed before writing to file *)
  check_log_rotation ();

  (* Write to file, if initiazed *)
  (match !log_file with
  | Some oc ->
      output_string oc full_msg;
      flush oc
  | None -> ());
  Lwt.return ()

(* Logging functions for different levels *)
let info msg = log_to_console_and_file Level.INFO msg
let error msg = log_to_console_and_file Level.ERROR msg
let debug msg = log_to_console_and_file Level.DEBUG msg
