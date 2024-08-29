## 1. Lists in OCaml

In OCaml, lists are a fundamental data structure that allow you to store sequences of elements of the same type. Lists are immutable, meaning that once created, they cannot be changed. Instead, operations on lists create new lists.

### 1.1 Building Lists

**Creating Lists:**

1. **Empty List**: An empty list is represented by `[]`. It’s a list that contains no elements.

   ```ocaml
   let empty_list = []
   ```

2. **Single Element List**: To create a list with a single element, use the `::` operator (known as "cons"). This operator adds an element to the front of a list.

   ```ocaml
   let single_element_list = 1 :: []  (* Result: [1] *)
   ```

3. **List Initialization**: You can also initialize a list with multiple elements using square brackets and semicolons.

   ```ocaml
   let number_list = [1; 2; 3; 4; 5]  (* Result: [1; 2; 3; 4; 5] *)
   ```

### 1.2 Working with Lists

**Basic Operations:**

- **Length of List**: To find the number of elements in a list.

   ```ocaml
   let length lst =
     let rec aux acc = function
       | [] -> acc
       | _ :: tl -> aux (acc + 1) tl
     in aux 0 lst
   ```

- **Summing Elements**: To compute the sum of all elements in a list of integers.

   ```ocaml
   let rec sum lst =
     match lst with
     | [] -> 0
     | hd :: tl -> hd + sum tl
   ```

- **Appending Lists**: To concatenate two lists.

   ```ocaml
   let rec append lst1 lst2 =
     match lst1 with
     | [] -> lst2
     | hd :: tl -> hd :: append tl lst2

   (* Tail-recursive version *)
   let append lst1 lst2 =
     let rec aux acc = function
       | [] -> List.rev acc @ lst2
       | hd :: tl -> aux (hd :: acc) tl
     in aux [] lst1
   ```

### 1.3 Immutability of Lists

Lists in OCaml are immutable. When you perform operations on a list, you create a new list rather than modifying the existing one.

**Example: Incrementing the First Element:**

```ocaml
let inc_first lst =
  match lst with
  | [] -> []
  | hd :: tl -> (hd + 1) :: tl
```

### 1.4 Pattern Matching with Lists

Pattern matching allows you to destructure lists and perform operations based on their structure.

**Examples:**

- **Summing the Elements:**

   ```ocaml
   let rec sum = function
     | [] -> 0
     | hd :: tl -> hd + sum tl
   ```

- **Finding Length:**

   ```ocaml
   let rec length = function
     | [] -> 0
     | _ :: tl -> 1 + length tl
   ```

- **Concatenating Lists (Tail-Recursive):**

   ```ocaml
   let append lst1 lst2 =
     let rec aux acc = function
       | [] -> List.rev acc @ lst2
       | hd :: tl -> aux (hd :: acc) tl
     in aux [] lst1
   ```

**Pattern Matching Syntax:**

```ocaml
match expression with
| pattern1 -> result1
| pattern2 -> result2
...
| patternN -> resultN
```

**Pattern Types:**

- **Variable Pattern**: Matches any value and binds it to a variable.

   ```ocaml
   match [1; 2; 3] with
   | x -> x  (* x will be [1; 2; 3] *)
   ```

- **Wildcard Pattern**: Matches any value but does not bind it to a variable.

   ```ocaml
   match [1; 2; 3] with
   | _ -> "whatever"
   ```

- **Empty List Pattern**: Matches an empty list.

   ```ocaml
   match [] with
   | [] -> "Empty list"
   ```

- **Cons Pattern**: Matches a list with at least one element, separating the head and tail.

   ```ocaml
   match [1; 2; 3] with
   | hd :: tl -> (hd, tl)  (* hd is 1, tl is [2; 3] *)
   ```

**Deep Pattern Matching Example:**

```ocaml
match [1; 2; 3] with
| _ :: _ :: [] -> "List with exactly two elements"
| _ :: _ -> "List with at least two elements"
| [] -> "Empty list"
```

### 1.5 Tail Recursion

Tail recursion is a form of recursion where the recursive call is the final operation in the function. It allows the compiler to optimize the recursion to prevent stack overflow.

**Non-Tail Recursive Sum:**

```ocaml
let rec sum lst =
  match lst with
  | [] -> 0
  | hd :: tl -> hd + sum tl
```

**Tail Recursive Sum:**

```ocaml
let sum lst =
  let rec aux acc = function
    | [] -> acc
    | hd :: tl -> aux (hd + acc) tl
  in aux 0 lst
```

**Tail Recursion Importance:**

Tail-recursive functions are more efficient because they reuse the current function’s stack frame, reducing memory usage and stack overflow risks for large lists.

**Example of Tail Recursive List Creation:**

```ocaml
let rec from i j l =
  if i > j then l
  else from i (j - 1) (j :: l)

let range_list = from 1 10 []  (* Creates a list [1; 2; 3; 4; 5; 6; 7; 8; 9; 10] *)
```

Using `List.init` to create a large list efficiently:

```ocaml
(* Create a list from 0 to 999,999 *)
let large_list = List.init 1_000_000 Fun.id
```

### 1.6 OCamldoc and List Syntax

**OCamldoc** is a documentation tool that generates HTML or other formats from comments in OCaml code. When documenting lists, be mindful of how square brackets are used.

**Example OCamldoc Comment:**

```ocaml
(** [hd lst] returns the first element of [lst].
    Raises [Failure "hd"] if [lst = []]. *)
```

In the comment:
- `[hd lst]` is formatted as code.
- `[lst = []]` refers to the empty list, with square brackets used for formatting.

**Note:** Square brackets in OCamldoc comments denote code formatting and should not be confused with actual list syntax.

### 1.7 List Comprehensions

OCaml does not have built-in list comprehensions like some other languages (e.g., Python). Instead, it uses higher-order functions such as `List.map` and `List.filter` for similar purposes.

**Example Using `List.map` and `List.filter`:**

```ocaml
(* Create a list of even numbers from 0 to 18 *)
let evens = List.filter (fun x -> x mod 2 = 0) (List.map (fun x -> x * 2) (List.init 10 Fun.id))
```

### Summary

Lists are a versatile and essential data structure in OCaml, allowing you to work with sequences of elements efficiently. Understanding their immutability, how to manipulate them with pattern matching, and the importance of tail recursion are crucial for effective functional programming in OCaml.
