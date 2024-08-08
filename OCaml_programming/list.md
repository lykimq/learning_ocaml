## 1. Lists
A list is like a train with cars linked together, where each car can hold a toy (a value). All the toys in the train have to be of the same type - like all cars carrying only toy dinosaurs or only toy cars, but not a mix of both.

1.1 Building Your Train (Creating Lists)

There are a few ways to build your train:

1. Empty train: If you don't have any toys yet, your train is empty. In OCaml, this empty train is called `[]` (pronounced "nil").

2. Adding a toy to the train: If you have a toy and you want to add it to the front of your train, you can use the `::` operator (called "cons"). For example, `3 :: []` means you are putting the toy "3" in the first car of your train, and the rest of the train is empty.

3. A whole train at once: You can also build an entire train at once using square brackets. For example, `[1; 2; 3]` is a train with three cars carrying the toys "1", "2", and "3".

OCaml make it easy and pleasant to work with lists directly in the language, just like other functional programming languages do. This makes a list "first-class" part of OCaml, meaning they are really important and used often.

1.2 How Lists Work:
- Values in the List: when you write `[]`, it is already a complete train with no toys, so it is considered a value.

- Putting toys together: If you have a toy `e1` and another train `e2` and if `e1` becomes `v1` and `e2` becomes `v2`, then `e1 :: e2` becomes `v1 :: v2`, meaning you have added that toy to the train.

1.3 Everything Should Match (Static Semantics):
- Same Type of Toys: Every toy in the train has to be of the same type. If the toys are numbers, the types of the train is `int list`. If they are words, it is a `string list`. Think of it like all cars of the train must carry the same kind of toy.

1.4 Taking the Train Apart (Pattern Matching):

To see what is inside your train, you can use a special tool call **pattern matching**. Pattern matching allows you to check if your train is empty or if it has toys, and then do something based on that.

For example:

- Summing the Toys: Here is how you sum up the toys in a train of numbers:

```ocaml
let rec sum lst =
    match lst with
    | [] -> 0
    | hd :: tl -> hd + sum tl
```
If the train is empty, the sume is `0`. If it has toys, you add the first toy to the sume of the rest.

- Finding the Train Length: To count how many toys are in the train:

```ocaml
let rec length lst =
    match lst with
    | [] -> 0
    | _hd :: tl -> 1 + length tl
```
Again, if it is empty, the count is `0`. Otherwise, you count the first toy and keep counting the rest.

- Connecting Two Trains: To join two trains together:

```ocaml
let rec append lst1 lst2 =
    match lst1 with
    | [] -> lst2
    | hd :: tl -> hd :: append tl lst2
```
If the first train is empty, the result is just the second train. Otherwise, you attach the first car to the train made by connecting the rest of the cars.

Tail-recursive function of `append`: We can make it tail-recursive, we can use an accumulator to build the result as we go along, and then reverse the accumulated list at the end:

```ocaml
let append lst1 lst2 =
    let rec aux acc lst1 =
        match lst1 with
        | [] -> List.rev acc @ lst2
        | hd :: tl -> aux (hd :: acc) tl
    in
    aux [] lst1
```

**How it works**
- Accumulator (`acc`): We use an accumulator to collect the elements of `lst1` in reverse order. This ensures that each recursive call is tail-recursive, as the last operation is just the recursive call to `aux`.
- Base case: when `lst1` is empty, we reverse the accumulated list (`acc`) and concatenate it with `lst2`.
- Recursive case: for each element in `lst1`, we cons it onto the accumulator and continue with the tail of the list.

This tail-recursive version is more efficient for large lists because it avoids growing the stack with each recursive call.

1.5 List Cannot Change (Immutable Lists)
Once you have built your train, you can't change any of the toys inside. If you need to change something, you create a new train. This immutability means the pieces of the old train can be safely shared with the new one, without worrying about someone else chaning it behind your back.

For instance, if you want to increase the first toy by one:

```ocaml
let inc_first lst =
    match lst with
    | [] -> []
    | hd :: tl -> hd + 1 :: tl
```
This create a new train where only the first toy is changed, but the rest of the train stay exactly the same.

1.6 What is pattern matching?
Imagine pattern matching like a game where you have a toy box (this is your list) and you want to find out what is inside it by checking different shapes of toys (these are patterns). If the shape of the toy you see in the box matches the shape you are looking for, you know what you have. If it does not match, you try the next shape.

**Syntax of pattern matching**
Here is the basic way to use pattern matching in OCaml:

```ocaml
match e with
| p1 -> e1
| p2 -> e2
| ...
| pn -> en
```

- `e` is the toy box (or list) you are checking.
- `p1, p2, ..., pn`: are the shapes of toys you are looking for (patterns).
- `e1, e2, ..., en`: are what you get if the toy matches the shape.

**Types of patterns**
a. Variable pattern (`x`): matches any toys and gives you that toy.

```ocaml
match [1; 2; 3] with
| x -> x (* x will be [1; 2; 3] *)
```

b. Wildcard pattern (`_`): matches any toys but does not tell you what it is.

```ocaml
match [1; 2; 3] with
| _ -> "whatever"
```

c. Empty list pattern (`[]`): matches an empty toy box.

```ocaml
match [] with
| [] -> "Empty box"
```

d. Cons pattern (`p1 :: p2`): matches a toy box with at least one toy and separates the first toy `p1` from the rest `p2`

```ocaml
match [1; 2; 3] with
| [1; 2; 3] -> "Match found!"
```

**How pattern matching works**
a. Check the toy box: find out what is inside the box (`e`).
b. Try each shape: see if the toy fits the first pattern (`p1`). If not, try the next one (`p2`) and so on.
c. Get the result: if you find a match, use the associated result (`e1, e2`, etc.). If not match, it raise an error.

**Example in action**

```ocaml
match 1 :: [] with
| [] -> false
| hd :: tl -> hd = 1 && tl = []
```

- `1 :: []`: is a toy box with one toy: `1`.
- `[]` does not match `1 :: []`.
- `hd :: tl` matches `1 :: []`. Here, `hd` is `1` and `tl` is `[]`

Substitue these into the result part:
- `hd = 1 && tl = []` becomes `1 = 1 && [] = []`, which is `true`.

So, so the result is `true`.

**Static checks**
OCaml checks two things with patterns:

a. Exhaustiveness: Make sure you have patterns to cover all possibilites. For example, if you write a function that only handles some cases of a list, OCaml warns you.

```ocaml
let head lst =
    match lst with
    | hd :: _ -> hd
```

**Warning**: This does not handle the empty list `[]`

b. Unused branches: Checks if some patterns are unneccessary because eariler ones already cover those cases.

```ocaml
let rec sum lst =
    match lst with
        | hd :: tl = hd + sum tl
        | [hd] -> hd
        | [] -> 0
```

**Warning**: The `[hd]` case will never be reached because `hd :: tl` already covers all cases with at least one element.

**Deep pattern matching**
You can look inside lists deeply:
- `_ :: []`: matches lists with exactly one toy.
- `_ :: _`: matches lists with at least one toy.
- `_ :: _ :: []`: matches lists with exactly two toy.

**Immediate matches**

If your function immediately patterns the argument, you can simplify it:

Instead of:

```ocaml
let rec sum lst =
    match lst with
    | [] -> 0
    | hd :: tl -> hd + sum tl
```

You can write:

```ocaml
let rec sum = function
    | [] -> 0
    | hd :: tl -> hd + sum tl
```

Here, `function` replaces `match` and you don't need to name the argument.

1.7 OCamldoc and List syntax

OCamldoc is a tool that automatically generates documentation from comments in OCaml source code, similar to Javadoc in Java. It helps create HTML (or other formats) documentation for OCaml code. For isntance, the documentation for the `List` module in OCaml is created using OCamldoc.

**Warning about square brackets in OCamldoc**:
In OCamldoc commets, square brackets are used to format code snippets, not to denote lists. This can be confusing when discussing lists. For example, if you see:

```ocaml
(** Return the first element of the given list. Raise
    [Failure "hd"] if the list is empty. *)
```

Here `[Failure "hd"]` is not a list but a formatted piece of code.

To avoid confusion, when talking about lists in documentation, square brackets inside the comment denote lists, while square brackets outside are for formatting code. For example:

```ocaml
(** [hd lst] returns the first element of [lst].
    Raise [Failure "hd"] if [lst = []] *)
```

In this comment:
- `[hd lst]` is formatted as code.
- `[lst = []]` refers to the empty list, with the outer brackets used for formatting.

1.8 List comprehensions

List comprehensions are a way to create lists based on existing lists, often using a syntax similar to mathematical set notation. For example, in Python, you might right:

```python
[x * 2 for x in range (10) if x % 2 == 0]
```

This creates a list of even numbers from 0 to 18

OCaml does not have built-in list comprehensions. Instead, OCaml provides a way to achieve similar results, such as using higher-order functions (liek `List.map` and `List.filter`) and the pipeline operator. Because these techniques are powerful and sufficient, OCaml does not include separate syntax for list comprehensions.

1.9 Tail recursion

Tail recursion is a specific type of recursion where the recursive call is the last action in the function. This is important for performance because it allows the OCaml compiler to optimize the function to use less memory.

Consider these two implementations of summing a list:

a. Non-tail recursive function

```ocaml
let rec sum lst =
    match lst with
    | [] -> 0
    | hd :: tl -> hd + (sum tl)
```

In this function, after calling `sum tl`, it adds `hd` to the result. The addition happens after the recursive call returns, making this function non-tail recursive.

b. Tail recursive function

```ocaml
let sum lst =
    let rec aux acc l =
        match l with
        | [] -> acc
        | hd :: tl -> aux (hd + acc) tl
    in aux 0 lst
```

Here `aux` accumulates the sum in the `acc` parameter and immediately returns the result of the recursive call without any further computation. This make `aux` a tail-recursive function.

**Why tail recursive matters**:
Tail-recursive functions are more memory efficient because they are reuse the current function's stack frame for the next call. This is particularly useful for functions that handle large lists.

**Example of tail recursive list creation**:

```ocaml
(** [from i j l] is the list containing the integers from [i] to [j],
    inclusive, followed by the list [l].
    Example: [from 1 3 [0] = [1; 2; 3; 0]] *)

    let rec from i j l =
        if i > j
        then l
        else from i (j - 1) (j :: l)

    (** [i -- j] is the list contatining the integers from [i] to [j],
    inclusive. *)

    let long_list = 0 -- 1_000_000
```

In this example:
- `from` generates a list of integer from `i` to `j` adn then appends list `l`.
- `( -- )` is a custom operator to create a list of integers from `i` to `j`.

Using `List.init` to create a large list:

```ocaml
List.init 1_000_000 Fun.id
```

This creates a list from `0` to `1_000_000` using the built-in `List.init` function, which is optimized for performance and tail-recursive for large lists.
