module String_Conversion : sig
  val escape_string : string -> string
  val hex_of_string : string -> string
  val readable_of_string : string -> string
  val base64_of_string : string -> string
end = struct
  (* Escape non-printable characters replaces non-printable characters with a
     hexadecimal.
     For example: '\x1f'

     Use case: useful for debugging or logging where readability of
     non-printable characters is important. Common in debugging and error
     reporting where the exact byte values of non-printable characters need to
     be visible.
  *)
  let escape_string s =
    let buf = Buffer.create (String.length s) in
    String.iter
      (fun c ->
        match c with
        | ' ' .. '~' ->
            (* Add printable as-is *)
            Buffer.add_char buf c
        | _ ->
            (* Replace non-printable characters with \xNN format *)
            Buffer.add_string buf (Printf.sprintf "\\x%02x" (Char.code c)))
      s;
    (* Convert the buffer to a string *)
    Buffer.contents buf

  (* Convert a string to its hexadecimal representation For example: '61' for
     'a'

     Use-case: it is often used in situations where you need a compact and
     human-reabable representation of binary data. It is commonly used in
     network protocols and file formats.
  *)
  let hex_of_string s =
    let hex = "0123456789abcdef" in
    let buf = Buffer.create (2 * String.length s) in
    String.iter
      (fun c ->
        (* Add a high nibble of the character *)
        Buffer.add_char buf (String.get hex (Char.code c lsr 4));
        (* Add a low nibble of the character *)
        Buffer.add_char buf (String.get hex (Char.code c land 0x0f)))
      s;
    Buffer.contents buf

  (* Convert a string to a readable format, replacing non-printable characters.
     Similar to espace_string, but ensure all characters are printed in a human
     readable form. It adds printable characters directly and replaces
     non-printable ones with hexadecimal.

     Use-case: ideal for debugging and logging where you want to see both
     printable and non-printable characters clearly. It is useful when you need
     to understand a string with mixed content
  *)
  let readable_of_string s =
    let buf = Buffer.create (String.length s) in
    String.iter
      (fun c ->
        if c >= ' ' && c <= '~' then
          (* Add printable characters as-is *)
          Buffer.add_char buf c
        else
          (* Replace non-printable characters with \xNN format *)
          Buffer.add_string buf (Printf.sprintf "\\x%02x" (Char.code c)))
      s;
    Buffer.contents buf

  (* Convert a string to its base64 representation. Base64 encoding transforms
     binary data into an ASCII string format by encoding every three bytes into
     four characters.

     Use-case: Base64 is commonly used for encoding binary data for text-based
     systems, such as in email attachments, data URLs, and some web APIs. It is
     popular in web applications and data serialization. *)
  let base64_of_string s =
    let b64 =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    in
    let pad =
      if String.length s mod 3 = 0 then ""
      else String.make (3 - (String.length s mod 3)) '='
    in
    let rec encode acc i =
      if i >= String.length s then acc
      else
        let a = Char.code s.[i] in
        let b = if i + 1 < String.length s then Char.code s.[i + 1] else 0 in
        let c = if i + 2 < String.length s then Char.code s.[i + 2] else 0 in
        let triplet = (a lsl 16) lor (b lsl 8) lor c in
        let enc = Bytes.create 4 in
        Bytes.set enc 0 b64.[(triplet lsr 18) land 0x3f];
        Bytes.set enc 1 b64.[(triplet lsr 12) land 0x3f];
        Bytes.set enc 2 b64.[(triplet lsr 6) land 0x3f];
        Bytes.set enc 3 b64.[triplet land 0x3f];
        let enc =
          if i + 2 >= String.length s then
            Bytes.sub_string enc 0 (4 - (3 - (String.length s mod 3)))
          else Bytes.to_string enc
        in
        encode (acc ^ enc) (i + 3)
    in
    encode "" 0 ^ pad
end
