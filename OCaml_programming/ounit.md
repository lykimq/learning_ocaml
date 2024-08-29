# Unit Testing with OUnit in OCaml

## Introduction

Unit testing is essential in software development to ensure that individual components (units) of your code function correctly. In this document, we will explore unit testing in OCaml using the `OUnit` framework. We will cover the following:

1. **Introduction to Unit Testing**
2. **Writing and Testing a Simple Function**
3. **Handling Test Failures**
4. **Improving Test Output**
5. **Reducing Repetitive Code in Tests**
6. **Testing Exceptions**
7. **Applying Test-Driven Development (TDD)**

## 1. Introduction to Unit Testing

Unit testing involves creating tests for small units of code to validate their correctness. The process typically follows Test-Driven Development (TDD), where you write tests before implementing the corresponding code. This approach helps you build and refine your code iteratively.

### Example Scenario

Imagine you are building a toy car and want to ensure it performs specific actions:
- Drive forward
- Turn left
- Stop

You would write tests to verify each functionality before building it. This concept is analogous to writing and running unit tests for your code.

## 2. Writing and Testing a Simple Function

Let's start with a basic example. We will implement a function `sum` that calculates the sum of numbers in a list.

### Implementing the `sum` Function

Here’s the implementation of the `sum` function in OCaml:

```ocaml
let rec sum = function
  | [] -> 0
  | x :: xs -> x + sum xs
```

This function works as follows:
- If the list is empty, it returns `0`.
- Otherwise, it returns the sum of the first element and the sum of the rest of the list.

### Writing Tests with OUnit

To ensure the correctness of the `sum` function, write tests using the `OUnit` framework:

```ocaml
open OUnit2
open Sum

let tests = "test suite for sum" >::: [
    "empty" >:: (fun _ -> assert_equal 0 (sum []));
    "singleton" >:: (fun _ -> assert_equal 1 (sum [1]));
    "two_elements" >:: (fun _ -> assert_equal 3 (sum [1; 2]));
]

let _ = run_test_tt_main tests
```

#### Explanation of Test Code

- `open OUnit2`: Imports the OUnit2 library.
- `open Sum`: Imports the module containing the `sum` function.
- `tests`: Defines a test suite with multiple tests.
  - `"empty"`: Tests if an empty list returns `0`.
  - `"singleton"`: Tests if a list with one element `[1]` returns `1`.
  - `"two_elements"`: Tests if a list `[1; 2]` returns `3`.
- `run_test_tt_main tests`: Executes the test suite.

## 3. Handling Test Failures

If the `sum` function has a bug, the tests will fail. For example, if the function is modified incorrectly:

```ocaml
let rec sum = function
  | [] -> 1 (* bug *)
  | x :: xs -> x + sum xs
```

Running the tests will produce failure messages:

```
FFF
==============================================================================
Error: test suite for sum:2:two_elements.
...
expected: 3 but got: 4
------------------------------------------------------------------------------
```

The `FFF` indicates all tests failed. The error message specifies which test failed and why, helping you identify and fix the bug.

## 4. Improving Test Output

To make test outputs more informative, use a **printer** function to show what the function returned:

```ocaml
let tests = "test suite for sum" >::: [
  "empty" >:: (fun _ -> assert_equal 0 (sum []) ~printer:string_of_int);
  "singleton" >:: (fun _ -> assert_equal 1 (sum [1]) ~printer:string_of_int);
  "two_elements" >:: (fun _ -> assert_equal 3 (sum [1; 2]) ~printer:string_of_int);
]
```

This will produce clearer messages if tests fail:

```
expected: 3 but got: 4
```

## 5. Reducing Repetitive Code in Tests

To avoid repetitive test code, create a function to generate tests:

```ocaml
let make_sum_test name expected_output input =
  name >:: (fun _ -> assert_equal expected_output (sum input) ~printer:string_of_int)

let tests = "test suite for sum" >::: [
  make_sum_test "empty" 0 [];
  make_sum_test "singleton" 1 [1];
  make_sum_test "two_elements" 3 [1; 2];
]
```

This approach keeps your test code clean and manageable.

## 6. Testing Exceptions

Sometimes, you need to test if a function handles errors correctly by raising exceptions. Here’s how to test for exceptions:

1. **Define a Function That Should Throw an Exception:**

    ```ocaml
    let divide x y =
      if y = 0 then failwith "Division by zero"
      else x / y
    ```

2. **Write a Test to Check for the Expected Exception:**

    ```ocaml
    let tests = "test suite for divide" >::: [
      "divide_by_zero" >:: (fun _ ->
        assert_raises (Failure "Division by zero") (fun () -> divide 10 0)
      );
    ]

    let _ = run_test_tt_main tests
    ```

#### Explanation

- `assert_raises`: Asserts that the function raises the specified exception.
- `Failure "Division by zero"`: The expected exception.

## 7. Applying Test-Driven Development (TDD)

TDD involves writing tests before implementing the corresponding code. Here’s how to apply TDD with a new function `next_weekday`:

1. **Write a Failing Test:**

    ```ocaml
    let tests = "test suite for next_weekday" >::: [
      "tue_after_mon" >:: (fun _ -> assert_equal Tuesday (next_weekday Monday))
    ]
    ```

2. **Implement the Function Incrementally:**

    ```ocaml
    let next_weekday d =
      match d with
      | Monday -> Tuesday
      | _ -> failwith "Unimplemented"
    ```

3. **Add More Tests and Update Implementation:**

    ```ocaml
    let next_weekday d =
      match d with
      | Monday -> Tuesday
      | Tuesday -> Wednesday
      | Wednesday -> Thursday
      | _ -> failwith "Unimplemented"
    ```

4. **Refactor and Ensure All Tests Pass.**

By following TDD, you iteratively build and refine your function based on the tests, ensuring all requirements are met.

## Conclusion

Unit testing with OUnit helps ensure your OCaml code functions as expected. By writing tests, handling failures, improving output clarity, and applying TDD principles, you can develop robust, reliable software.