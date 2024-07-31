open Alcotest
open Intro_ex

let epsilon = 1e-9

let assert_close ~test_name expected actual =
  check (float epsilon) test_name expected actual

(* Cube tests *)
let test_cube_zero () = assert_close ~test_name:"cube of 0.0" 0.0 (cube 0.0)
let test_cube_two () = assert_close ~test_name:"cube of 2.0" 8.0 (cube 2.0)

let test_cube_three_point_five_correct () =
  assert_close ~test_name:"cube of 3.5 (correct)" 42.875 (cube 3.5)

let test_cube_three_point_five_incorrect () =
  let test () =
    assert_close ~test_name:"cube of 3.5 (incorrect)" 42.8 (cube 3.5)
  in
  try
    test ();
    Alcotest.fail "Expected failure but the test passed."
  with Failure _ -> () (* Passes if the test fails *)

let tests_cube =
  [
    ("test_cube_zero", `Quick, test_cube_zero);
    ("test_cube_two", `Quick, test_cube_two);
    ( "test_cube_three_point_five_correct",
      `Quick,
      test_cube_three_point_five_correct );
    ( "test_cube_three_point_five_incorrect",
      `Quick,
      test_cube_three_point_five_incorrect );
  ]

(* Sign tests *)
let test_sign_positive () = check int "positive sign" 1 (sign 42)
let test_sign_negative () = check int "negative sign" (-1) (sign (-42))
let test_sign_zero () = check int "zero sign" 0 (sign 0)

let tests_sign =
  [
    ("test_sign_positive", `Quick, test_sign_positive);
    ("test_sign_negative", `Quick, test_sign_negative);
    ("test_sign_zero", `Quick, test_sign_zero);
  ]

let () =
  run "All tests" [ ("Cube tests", tests_cube); ("Sign tests", tests_sign) ]
