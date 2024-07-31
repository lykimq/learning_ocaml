open Intro_ex
open QCheck

(* Define the property: reverse a list twice return the original list *)
let reverse_twice_is_identity lst = reverse (reverse lst) = lst

(* Create a Qcheck test for this property *)
let reverse_property_test =
  (* generator for integers *)
  let int_gen = int in
  Test.make ~name:"reverse test" ~count:1000
    (list int_gen) (* Generates lists of integers *)
    reverse_twice_is_identity

(* Run the test with a specific seed *)
let () = QCheck_runner.run_tests_main [ reverse_property_test ]
