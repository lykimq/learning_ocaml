## 2. Variants

**What is a variant?**

A variant is like a special kind of box that can hold one of several different things. Imagine a toy box that can hold toys of different kinds, like cars, dolls, or blocks. In OCaml, variants let you create a type of data where each piece of data can be one of a few possible options.

For example, let's create a type for days of the week:

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

Here, `day` is the type, and `Sun, Mon, Tue, ...` are the different options (or "constructors") you can use.

**Using variants**
To use these options, you just write the name of the constructor:

```ocaml
let d = Tue
```

This means `d` is set to `Tue`, which is one of the options in the `day` type.

**Accessing variant values**

To figure out what a variant value represents, you use **pattern matching**. Here is how you can turn a day into a number:

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

If `d` is `Tue`, `int_of_day d` will return `3`.

**Syntax for variants**
- Defining a variant type:

```ocaml
type t =
| C1
| C2
| C3
```

- Using a constructor value:
Just write the name of the constructor, like `C1`

- Static semantic:
If you have `type = ... | C | ... ` then `C` is part of the type `t`.

**Scope and overlapping constructor name**:

If you define two types with constructors that have the same name, the later definition "wins". For example:

```ocaml
type t1 = C | D
type t2 = D | E

let x = D
```

Here, `x` will be of type `t2` because `t2` is defined after `t1`.

**Tips to avoiding confusion**

To avoid mix-ups when constructor names overlap, add a prefix to distinguish them. For example, in a Pokemon game:

```ocaml
type ptype =
    TNormal
    | TFire
    | TWater

type peff =
    ENormal
    | ENotVery
    | ESuper
```

Here, `TNormal` and `ENormal` are clearly different because they belong to different types.

**Pattern matching**
When you use pattern matching with variants, you match the exact constructor. For example:

```ocaml
let describle_day d =
    match d with
    | Sun -> "It is Sunday"
    | Mon -> "It is Monday"
    | Tue -> "It is Tuesday"
    | Wed -> "It is Wednesday"
    | Thu -> "It is Thursday"
    | Fri -> "It is Friday"
    | Sat -> "It is Saturday"
```

In this function, each pattern (`Sun`, `Mon`, etc.) directly matches the constructor value.




