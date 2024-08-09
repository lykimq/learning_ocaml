# Unit testing with OUnit

Imagine you are building a toy car. Before you start making the car, you write a list of what the car should do:
- Drive forward.
- Turn left.
- Stop.

Now, let's say you can magically test each part of the car before you actually build it! You write a test to see if the car can drive forward. At first, the test will fail because there is no car yet. Then, you build just enough of the car so it can drive forward, and you test it again. This time, it works. You keep doing this, one small step at a time, until the car is fully built and passed all the tests.

This is call **Test-Driven Developement (TDD)**, and it is just like building your toy car step by step.

**Now, let's talk about code**
You are going to write a simpel function, this function adds up all the numbers in a list. If you have the list `[1, 2, 3]`, the function should return `6` because `1 + 2 + 3 = 6`.

Here is how you would write that function:

```ocaml
let rec sum = function
| [] -> 0
| x :: xs -> x + sum xs
```
The code says: "If the list is empty `[]`, the sum is `0`. If not, take the first number `x` and add it to the sum of the rest of the list `xs`, and return that.

**Now, let's write some tests for it**
Next, you write some tests to make sure your function works correctly. The tests will check:
- What if the list is empty? It should return `0`.
- What if the list has one member, like `[1]`? It should return `1`.
- What if the list has two members, like `[1, 2]`? It should return `3`.

Here is what the tests look like:

```ocaml
open OUnit2
open Sum

let tests = "test suite for sum" >::: [
    "empty" >:: (fun _ -> assert_equal 0 (sum []));
    "singleton" >:: (fun _ -> assert_equal 1 (sum [1]));
    "two_members" >:: (fun _ -> assert_equal 3 (sum [1; 2]));
]

let _ = run_test_tt_main tests
```

This code does the following:

- `open OUnit2` and `open Sum`: This makes sure your tests can use the `OUnit2` testing library and the sum function you wrote.
- `tests`: This is a list of all the tests for your function.
- `assert_equal`: This checks if the function's output is what you expected. If it is, the test passes. If not, the test fails.

**What If There's a Bug?**
Let's say you accidentally introduced a bug in the sum function:

```ocaml
let rec sum = function
  | [] -> 1 (* bug *)
  | x :: xs -> x + sum xs
```

Now, if the list is empty, it returns `1` instead of `0`, which is wrong. If you run the tests, they will fail, and you'll see an output like this:

```ocaml
FFF
==============================================================================
Error: test suite for sum:2:two_elements.
...
expected: 3 but got: 4
------------------------------------------------------------------------------
```

The `FFF` at the top means that all three tests failed. The output tells you exactly which test failed and why. In this case, it expected `3` but got `4` instead.

**Improving the Test Output**
You can make the error messages clearer by using a **printer** function. This will show you what the function actually returned. Here’s how you do that:

```ocaml
let tests = "test suite for sum" >::: [
  "empty" >:: (fun _ -> assert_equal 0 (sum []) ~printer:string_of_int);
  "singleton" >:: (fun _ -> assert_equal 1 (sum [1]) ~printer:string_of_int);
  "two_elements" >:: (fun _ -> assert_equal 3 (sum [1; 2]) ~printer:string_of_int);
]
```

Now, if something goes wrong, you’ll see a message like this:

```ocaml
expected: 3 but got: 4
```

This makes it easier to figure out what went wrong.

**Making the Tests Less Repetitive**

Instead of writing the same kind of test multiple times, you can create a function that makes the test for you:

```ocaml
let make_sum_test name expected_output input =
  name >:: (fun _ -> assert_equal expected_output (sum input) ~printer:string_of_int)

let tests = "test suite for sum" >::: [
  make_sum_test "empty" 0 [];
  make_sum_test "singleton" 1 [1];
  make_sum_test "two_elements" 3 [1; 2];
]
```

This makes your code cleaner and easier to read.

**Testing Exceptions**
Sometimes, you want to test if a function correctly handles errors by throwing exceptions. But before we do that, you’ll need to learn more about exceptions in OCaml.

**Test-Driven Development (TDD)**
With TDD, you write your tests before you even write the function. For example, say you want to write a function that gives you the next weekday:

- Write a broken function
```ocaml
let next_weekday d = failwith "Unimplemented"
```

- Write a simple test

```ocaml
let tests = "test suite for next_weekday" >::: [
    "tue_after_mon" >:: (fun _ -> assert_equal Tuesday (next_weekday Monday))
]
```

- Run the test, see it fail, then fix the function bit by bit:

```ocaml
let next_weekday d =
match d with
| Monday -> Tuesday
| _ -> failwith "Unimplemented"
```

- Add more tests:

```ocaml
let testes = "test suits for next_weekday" >::: [
    "tue_after_mon" >:: (fun _ -> assert_equal Tuesday (next_weekday Monday));
    "wed_after_tue" >:: (fun _ -> assert_equal Wednesday (next_weekday Tuesday));
    "thu_after_wed" >:: (fun _ -> assert_equal Thursday (next_weekday Wednesday));
]
```

- Fix the function to pass the new tests:

```ocaml
let next_weekday d =
match d with
| Monday -> Tuesday
| Tuesday -> Wednesday
| Wednesday -> Thursday
| _ -> failwith "Unimplemented
```

- Refactor your code if needed and keep repeating this cycle until your function is complete and all tests pass.
