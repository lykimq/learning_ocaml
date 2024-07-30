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
open OUnit2

(*
 * - Define a function that computes the cude of a floating-point number.
 * - Test your function by applying it to a few inputs. *)

 let cube x =
  let result = x *. x *. x in
   Printf.printf "\nCubing %.2f gives %.8f\n" x result;
   result

(* A small value to allow for floating-point precision errors *)
let epsilon = 1e-9

(* A function to check if two floating-point numbers are close enough *)
let assert_close a b =
  assert_bool (Printf.sprintf "Expected %f but got %f\n" b a)
  (abs_float (a -. b) < epsilon)

(** TEST *)
let test_cube _ =
(* Define test cases *)
let tests =
  [
    (0.0, 0.0); (* exact match *)
    (2.0, 8.0); (* exact match *)
    (3.5, 42.875); (* correct expected value *)
    (3.5, 42.8); (* expected assertion failed *)
  ]
in
let assert_close_or_fail input expected =
let result = cube input in
try
  assert_close result expected
with
| Assert_failure _ ->
  Printf.printf "Test case failed for input %f: expected %f, got %f\n"
  input expected result
in
(* execute and validate each test case *)
List.iter (fun (input, expected) ->
  assert_close_or_fail input expected) tests
(* Execute test *)
let () =
  let suite = "Cube tests" >::: ["test_cube" >:: test_cube] in
  run_test_tt_main suite
