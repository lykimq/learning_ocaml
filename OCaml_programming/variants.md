## Variants in OCaml

### What is a Variant?

In OCaml, a variant type is a way to define a type that can have one of several different values. Each value is called a "constructor" and represents a different option for that type. Variants are useful for modeling data that can take on a limited set of predefined forms.

### Defining Variants

You define a variant type using the `type` keyword followed by a type name and a list of its possible constructors. For example, to define a type for days of the week:

```ocaml
type day =
| Sun
| Mon
| Tue
| Wed
| Thu
| Fri
| Sat
```

Here, `day` is the variant type, and `Sun`, `Mon`, `Tue`, etc., are the constructors for this type.

### Using Variants

To create a value of a variant type, you simply use one of the constructors. For example:

```ocaml
let d = Tue
```

In this example, `d` is of type `day` and is assigned the value `Tue`.

### Pattern Matching with Variants

Pattern matching is a powerful feature in OCaml that allows you to deconstruct variant values and handle them based on their specific constructors. For instance, to convert a `day` into its corresponding integer value:

```ocaml
let int_of_day d =
    match d with
    | Sun -> 1
    | Mon -> 2
    | Tue -> 3
    | Wed -> 4
    | Thu -> 5
    | Fri -> 6
    | Sat -> 7
```

Here, `int_of_day` matches the variant `d` against each possible constructor and returns the corresponding integer value.

### Syntax for Variants

- **Defining a Variant Type:**

    ```ocaml
    type t =
    | C1
    | C2
    | C3
    ```

- **Using a Constructor Value:**

    Simply write the constructor name, such as `C1`.

- **Static Semantics:**

    If you define `type t = ... | C | ...`, then `C` is a constructor of the type `t`.

### Scope and Overlapping Constructor Names

When you have multiple types with constructors having the same name, the most recently defined type takes precedence. For example:

```ocaml
type t1 = C | D
type t2 = D | E

let x = D
```

In this code, `x` will be of type `t2` because `t2` is defined after `t1`.

### Avoiding Confusion with Constructor Names

To avoid ambiguity when constructors overlap across different types, use descriptive prefixes. For instance, in a Pokémon game:

```ocaml
type ptype =
    | TNormal
    | TFire
    | TWater

type peff =
    | ENormal
    | ENotVery
    | ESuper
```

Here, `TNormal` and `ENormal` are clearly distinguished by their type context.

### Pattern Matching Details

When performing pattern matching with variants, you match against the specific constructors. For example, to provide a description for a `day`:

```ocaml
let describe_day d =
    match d with
    | Sun -> "It is Sunday"
    | Mon -> "It is Monday"
    | Tue -> "It is Tuesday"
    | Wed -> "It is Wednesday"
    | Thu -> "It is Thursday"
    | Fri -> "It is Friday"
    | Sat -> "It is Saturday"
```

In this function, each pattern (`Sun`, `Mon`, etc.) directly matches the corresponding constructor of the `day` type. This allows you to handle each case appropriately based on the variant value.