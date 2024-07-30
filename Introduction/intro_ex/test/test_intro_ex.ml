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
open Intro_ex

(* A small value to allow for floating-point precision errors *)
let epsilon = 1e-9

(* A function to check if two floating-point numbers are close enough *)
let assert_close a b =
  assert_bool
    (Printf.sprintf "Expected %f but got %f\n" b a)
    (abs_float (a -. b) < epsilon)

(** TEST *)
let test_cube_zero = "test_cube_zero" >:: fun _ -> assert_close (cube 0.0) 0.0

let test_cube_two = "test_cube_two" >:: fun _ -> assert_close (cube 2.0) 8.0

let test_cube_three_point_five_correct =
  "test_cube_three_point_five_correct" >:: fun _ ->
  assert_close (cube 3.5) 42.875

let assert_expected_failure f expected_msg =
  try
    f ();
    assert_failure "Expected failure but the test passed."
  with
  | Failure msg when msg = expected_msg -> ()
  | exn ->
      assert_failure
        (Printf.sprintf "Unexpected exeception: %s" (Printexc.to_string exn))

(* TEST *)
let test_cube_three_point_five_incorrect =
  "test_cube_three_point_five_incorrect" >:: fun _ ->
  assert_expected_failure
    (fun () -> assert_close (cube 3.5) 42.8)
    "Expected 42.8 but got 42.875"

let test_cube =
  "cube_tests"
  >::: [ test_cube_zero; test_cube_two; test_cube_three_point_five_correct ]

let _expected_failure =
  "expected_failures" >::: [ test_cube_three_point_five_incorrect ]

(***********************************************************************)
(* Define a function that computes the sign (1, 0, or -1) of an integer.
   Use a nested if expression.
   Test your function by applying it to a few inputs.*)
let test_sign_positive =
  "test_sign_positive" >:: fun _ -> assert_equal 1 (sign 42)

let test_sign_negative =
  "test_sign_negative" >:: fun _ -> assert_equal (-1) (sign (-42))

let test_sign_zero = "test_sign_zero" >:: fun _ -> assert_equal 0 (sign 0)

let test_sign =
  "sign_tests" >::: [ test_sign_positive; test_sign_zero; test_sign_negative ]

let test_suite = "test_suite" >::: [ test_cube; test_sign ]

let () =
  let result = run_test_tt_main test_suite in
  match result with _ -> ()
