open Lwt.Infix

(* [safe_close: Unix.file_descr -> unit Lwt.t]

    This function provides a safe way to shut down and close a socket file
    descriptor.

    It serves as a workaround to avoid using `Lwt_unix.close` directly, as
    calling it often raises errors such as `Unix.EBADF` (Bad File Descriptor)
    during  socket closure, especially when the socket might already be in an
    invalid state or prematurely closed elsewhere in the system.

    Instead of relying on `Lwt_unix.close`, this function manually shuts down
    the socket using `Unix.shutdown` to ensure that no further reads or write
    are allowed on the socket. It then calls `Unix.close` to close the socket,
    while catching and handling potential errors like `Unix.ENOTCONN` (Not
    Connected) and `Unix.EBADF`.

    The function performs the following steps:
    1. Logs the intent to shut down the socket.
    2. Shuts down the socket for both reads and writes using `Unix.shutdown`.
    3. If the socket is already closed or not connected, logs the information
       and safely continues.
    4. After shutdown, attempts to close the socket using `Unix.close`.
    5. Logs any errors that occur during the shutdown or close process, and
       handles common errors like `Unix.EBADF` and `Unix.ENOTCONN`

   This approach ensures that the socket is properly cleaned up without causing
   unexpected exceptions or crashes due to invalid file descriptors.
*)

let safe_close socket_fd =
  (* Check if the socket file descriptor is valid *)
  Lwt.catch
    (fun () ->
      (* First, shutdown the socket for both reads and writes *)
      Logs_lwt.info (fun m -> m "Shutting down the socket...") >>= fun () ->
      Lwt.catch
        (fun () ->
          Unix.shutdown socket_fd Unix.SHUTDOWN_ALL;
          Logs_lwt.info (fun m -> m "Socket shutdown complete.") >>= fun () ->
          Lwt.return_unit)
        (function
          | Unix.Unix_error (Unix.ENOTCONN, _, _) ->
              Logs_lwt.info (fun m -> m "Socket was not connected; continuing.")
              >>= fun () -> Lwt.return_unit
          | Unix.Unix_error (Unix.EBADF, _, _) ->
              Logs_lwt.info (fun m ->
                  m "Socket already closed or invalid during shutdown")
              >>= fun () -> Lwt.return_unit
          | exn ->
              Logs_lwt.err (fun m ->
                  m "Error during socket shutdown: %s" (Printexc.to_string exn)))
      >>= fun () ->
      (* After shutdown, manually close the socket using Unix.close *)
      Logs_lwt.info (fun m -> m "Closing the socket...") >>= fun () ->
      try
        Unix.close socket_fd;
        Logs_lwt.info (fun m -> m "Socket closed successfully.") >>= fun () ->
        Lwt.return_unit
      with
      | Unix.Unix_error (Unix.EBADF, _, _) ->
          Logs_lwt.info (fun m ->
              m "Socket already closed or invalid during close.")
          >>= fun () -> Lwt.return_unit
      | exn ->
          Logs_lwt.err (fun m ->
              m "Error during socket close: %s" (Printexc.to_string exn))
          >>= fun () -> Lwt.fail exn)
    (function
      | Unix.Unix_error (Unix.EBADF, _, _) ->
          Logs_lwt.info (fun m -> m "Socket was already closed.") >>= fun () ->
          Lwt.return_unit
      | exn ->
          Logs_lwt.err (fun m ->
              m "Unexpected error: %s" (Printexc.to_string exn))
          >>= fun () -> Lwt.fail exn)
