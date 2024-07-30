# Chapter 4: Functions

## What is a function?
Imagine a function like a magic box. You put something into it, and it gives you something back.

- Non-recursive function: This is a simpel box. You put iin your number, and it gives you a result.
- Recursive function. This is a special kind of magic box that you can use its own results to keep working.

**Examples**

1. Factorial function:
- Imagine a box that multiplies all number from 1 up to a number you give it. For example, if you give it 4, it multiplies `4 x 3 x 2 x 1` and gives you 24.
2. Power function:
- Imagine a box that can take a number and raise it to the power of another number. If you give it 2 and 3, it will multiply `2 x 2 x 2` and gives you 8.

## Writing functions in OCaml

When you create these magic boxes in OCaml, you use special words to define them:

- Simple function: just write the name of your box and what it does:

```ocaml
let add_two x = x + 2
```

- Recursive function: use the word `rec` to say your box can use its own results ot keep working:

```ocaml
let rec factorial n = if n = 0 then 1 else n * factorial (n - 1)
```

## Types of functions

In OCaml, every magic box (function) has a type that tells what kind of inputs it needs and what kind of output it gives. For examples:

- Type: `int -> int` means the box takes an integer (whole number) as input and gives back an integer.

## Understanding the code

When you write a function, you don't need to worry too much about its type at first. OCaml can figure it out for oyu. But if something goes wrong, you might need to check the type to fix it.

## Anonymous functions

Imagine you have a magis box that does something special but does not have a name. For example, if you have a magic box that adds 1 to any number you put in, you can use it right away without giving it a name. This is called an **anonymous function** or **lambda expression**.

- Named function: you can have a named magic box like `add_one` that always adds 1:

```ocaml
let add_one x = x + 1
```

- Anonymous function: or, you can use a magic box without a name like this:

```ocaml
fun x ->  x + 1
```

Both do the same thing -- add 1 to a number. But the anonymous function does not have a name; it is like using a magic trick right on the spot!

## Function application

Using a function is like putting something into your magic box and getting something back.

- Simple use: if you have a box named `add_one`, you can use it like this:

```ocaml
add_one 5
```
This means you are putting 5 into the box, and it gives you 6.

- With anonymous function: you can also use an anonymous box directly:

```ocaml
(fun x -> x + 1) 5
```
Here, you are using the unnamed box to add 1 to 5, just like before.

## The pipeline operator

Imagine you have have a line of magic boxes, and you want to send something through them one by one. This is what the pipeline operator `|>` does. It makes it easy to send a number through a series of magic boxes in a straight line.

- Without pipeline

```ocaml
square (add_one 5)
```
Here, you first put 5 into the `add_one` box and then put the result into the `square` box. It is like having to keep track of where your number is going.

- With pipeline

```ocaml
5 |> add_one |> square
```
This means you send 5 into `add_one`, and then take the result and send it into `square`. It is like a straight line where the number flows smoothly from one box to the next.

## What are polymorphic functions?

Imagine you have a magic box that can handle many different kinds of things - like toys, fruits, or books -- without needing to know in advance what type of thing it will handle. This magic box is like a **polymorphic function**. It can work with different types of things and still do the same task.

## The identity function

The simplest polymorphic function is the **identity function**. It is like a magic box that just gives you back whatever you put into it:

- With a name

```ocaml
let id x = x
```

- Without a name (anonymous)

```ocaml
let id = fun x -> x
```

No matter what you put into the box, you get the same thing back. You can put in a number, a word, or anything else, and it will just return it as is:

```ocaml
id 42 (* gives back 42 *)
id true (* gives back true* )
id "hello (* gives back "hello* )
```

## Type variables

In programming, we use symbols like `'a` to represent different types. Think of `'a` as a placeholder for any type of thing.

- `'a` in `id: 'a -> 'a` means that `id` can take any type and give back the same type. It is very flexible!

## More restrictive types

Sometimes, you might want to limit your magic box to only handle specific types. For examples:

- A box of integers only

```ocaml
let id_int (x: int) : int = x
```
This box only works with numbers and will give back the same number you put int. If you try to put in a word, it won't work:

```ocaml
id_int true (* Error! True is not a number *)
```

## Why type restriction works

You can think of the original `id` box as a universal box that can handle anything. When you specify it to only handle integers `id_int`, you are saying: "This box now only deals with numbers, but it still works the same way as `id`.

## Trying to change types

Sometimes, if you try to do something that is not allowed, like changing the type in a function, you will get an error. For example, if you have a box that only handles numbers, you cannot use it for something that isn't a number:

- A box that adds 1
```ocaml
let id' : 'a -> 'a = fun x -> x + 1
```
This box only works with numbers because adding 1 is only something you can do with numbers. If you try to use it with something that isn't a number, it won't work:

```ocaml
id' true (* Error! True is not a number *)
```

## Labeled and optional arguments

### Labeled arguments

Sometimes, functions have many arguments or arguments of the same type. It can be hard to remember the order, espcially if you are using the function frequently. **Labeled arguments** help to make your code clearer by allowing you to specify which argument you are passing.

Here is how you define a function with labeled arguments:

```ocaml
let f ~name1:arg1 ~name2:arg2 = arg1 + arg2
```

In this example:
- `name1` and `name2` are labels for the arguments.
- `arg1` and `arg2` are the values for these arguments.

You can call the function in any order as long as you use the labels:

```ocaml
f ~name2:3 ~name1:4 (* Result in 7 *)
```

If labels match the argument names, you can use a shorter syntax:

```ocaml
let f ~name1 ~name2 = name1 + name2
```

You can also annotate the type explicitly:

```ocaml
let f ~name1:(arg1: int) ~name2:(arg2: int) = arg1 + agr2
```

### Optional arguments
You can also make some arguments optional, providing a default value if they are not supplied. Here is how you declare an optional argument:

```ocaml
let f ?name(arg1 = 8) arg2 = arg1 + arg2
```

In this case:
- `?name` indicates that `name` is optional
- `arg1 = 8` sets the default value to `8` if `name` is not provided.

You can call this function with or without the optional argument:

```ocaml
f ~name:2 7 (* Results in 7 *)
f 7 (* Results in 15 *)
```

## Partial application
Partial application allows you to fix some arguments of a function and get a new function that takes the remaining arguments.

### Example of partial application

Define a function `add`

```ocaml
let add x y = x + y
```

You can partially apply `add`:

```ocaml
let add5 = add 5
```

Here `add5` is a new function that takes one argument and adds `5` to it:

```ocaml
add5 2 (* Results in 7 *)
```

### Different forms of partial application
The function `addx` shows an alternative way to partially apply functions:

```ocaml
let addx x = fun y -> x + y
```

Both `add` and `addx` can be used to achive the same result:

```ocaml
let add5 = add 5
let add5' = addx 5
```

## Function associativity

In OCaml, every function takes exactly one argument. For example, the function `add`:

```ocaml
let add x y = x + y
```
This is equivalent to:

```ocaml
let add = fun x -> (fun y -> x + y)
```

This means that `add` is a function that takes an `x` and returns another function that takes `y`.

- Function types: `int -> int -> int` is the same as `int -> (int -> int)`
- Application associativity: function application is left associative. So, `e1 e2 e3 e4` is the same as `((e1 e2) e3) e4`.

## Operators as functions
Operators in OCaml, like `+` are functions:

```ocaml
(+) 3 4 (* Results in 7 *)
```

You can create your own infix operators:

```ocaml
let (^^) x y = max x y
```

Here, `2 ^^ 3`` results in `3`. Be cautious about using non-standard characters and precedence rules when defining operators.

## Tail recursion

Tail recursion is a special kind of recursion where the recursive call is the last operation in the function. This means there is no additional work to be done after the recursive call returns. As a result, the function does not need to save any state after the call, this allows the OCaml compiler to optimize the function call and reuse the stack frame, preventing stack overflow.

### Example of tail recursion

Consider the non-tail-recursion `count` function

```ocaml
let rec count n =
   if n = 0
   then 0
   else 1 + count (n - 1)
```
In this function:
- `count (n - 1)` is the recursive call.
- After the recursive call returns, we still need to add `1` to the result. Each recursive call must keep tract of this pending addition, leading to a new stack frame for each call. This can cause a stack overflow for large values of `n`.

To make it tail-recursive:

```ocaml
let rec count_aux n acc =
    if n = 0
    then acc
    else count_aux (n - 1) (acc + 1)

let count_tr n = count_aux n 0
```
In this tail-recursive version:
- `count_aux` is a helper function that takes an additional argument `acc`.
- The accumulator `acc` holds the current count.
- `count_tr` is the main function that iniitalizes the accumulator to `0`

Step-by-steo execution

Let's see how `count_tr 3` would execute:
1. `count_tr 3` calls `count_aux 3 0`.
2. `count_aux 3 0` checks if `n = 0` (it isn't), so it calls `count_aux (3 - 1) (0 + 1)` which is `count_aux 2 1`
3. `count_aux 2 1` checks if `n = 0` (it isn't), so it calls `count_aux (2 - 1) (1 + 1)`, which is `count_aux 1 2`
4. `count_aux 1 2` check if `n = 0` (it isn't), so it calls `count_aux (1  - 1) (2 + 1)`, which is `count_aux 0 3`
5. `count_aux 0 3` check if `n=0` (it is), so it returns `3`

At each step, the recursive call is the last operation performed by the function, making it tail-recursive. This state (the value of `acc`) is passed along without needing additional stake frame, enabling tail-call optimization.

### Tail recursive recipe

1. Create a helper function: introduce an accumulator parameter.
2. Update the main function: call the helper function with the initial accumulator value.
3. Change the helper function: update the base case to return the accumulator and perform all additional work before the recursive call.

### Example: tail recursive factorial

Transform the factorial function to be tail-recursive

1. Origial factorial function

```ocaml
let rec fac n =
    if n = 0
    then 1
    else n * fac (n - 1)
```

2. Tail-recursive version:

```ocaml

let rec fact_aux n acc =
    if n = 0
    then acc
    else fact_aux (n - 1) (n * acc)

let fac_tr n = fact_aux n 1
```

with this tail-recursive version, you can calculate large factorials without running into stack overflow issues.

### Advantages and disadvantages of tail-recursive

#### Advantages

- Memory efficiency: The tail-recursive version use constant stake space. Instead of creating new stack frames for each recursive call, it reuses the same stake frame.
- Scalability: The tail-recursive function can handle larger input sizes without risking a stack overflow. For example, `count_tr 1_000_000` can execute without running out of stake space.
- Performance: Reduced overhead from avoding stake frame creating and destruction can make the tail-recursive function faster.

#### Disadvantages
- Complexity: Introducing an accumulator and a helper function can make the code less intuitive and harder to write, especially for more complex functions.
- Readability: The additional parameters and helper functions can make the code harder to read and understand, particularly for beginners.

