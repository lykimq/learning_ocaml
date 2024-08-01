(********************************************************************
 * Exercise: more fun
 * - Define a function that computes the cude of a floating-point number.
 * - Test your function by applying it to a few inputs.
 *
 * - Define a function that computes the sign (1, 0, or -1) of an integer
 * Use a nested if expression.
 * - Test your function by applying it to a few inputs.

* - Define a function that computes the area of a circle given its radius.
* - Test your function with [assert]
 ********************************************************************)

(*
 * - Define a function that computes the cude of a floating-point number.
 * - Test your function by applying it to a few inputs. *)

let cube x =
  let result = x *. x *. x in
  result

(***********************************************************************)
(* Define a function that computes the sign (1, 0, or -1) of an integer.
   Use a nested if expression.
   Test your function by applying it to a few inputs.*)

let sign x = if x > 0 then 1 else if x < 0 then -1 else 0

(***********************************************************************)
(* Define a reverse list *)

let reverse lst =
  let rec aux acc = function [] -> acc | hd :: tl -> aux (hd :: acc) tl in
  aux [] lst

(***********************************************************************)
(* Define a function to convert a list of integers into a comma-separated
    string, as an example to use the library: expect-test
   Ref: https://www.chrisarmstrong.dev/posts/unit-testing-with-ppx_expect
*)

let list_to_string lst =
  let rec aux = function
    | [] -> ""
    | [ x ] -> string_of_int x
    | hd :: tl -> string_of_int hd ^ ", " ^ aux tl
  in
  aux lst

(* ppx_expect only works on libraries, not executables.
   If your tests are successful, you will see no output.
*)

let%expect_test "list_to_string" =
  print_endline (list_to_string [ 1; 2; 3; 4; 5 ]);
  [%expect {|1, 2, 3, 4, 5|}]
