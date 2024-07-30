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
