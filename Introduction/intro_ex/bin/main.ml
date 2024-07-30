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
open Intro_ex

(* Main function *)
let () =
  let num = 2.0 in
  let _ = Printf.printf "\nCubing %.2f gives %.8f\n" num (cube num) in
  let int_num = -5 in
  let _ = Printf.printf "Sign of %d is %d\n" int_num (sign int_num) in
  ()
