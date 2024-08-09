# Records and Tuples

## Records in OCaml
- Definition: A record in OCaml is a composite data type similar to structs in C, where each element (field) is named and can have different type.
- Syntax:
    - Type definition:
        ```ocaml
        type mon = {name: string; hp: int; ptype: ptype}
        ```
    - Creating a record:
        ```ocaml
        let c = {name = "Charmander"; hp = 39; ptype = TFire}
        ```
    - Accessing fields:
        ```ocaml
        let hit_points = c.hp
        ```
- Patten matching:
    - Simple pattern matching:
        ```ocaml
        match c with {name; hp; ptype} -> hp
        ```
    - Using same name pattern variables:
        ```ocaml
        match c with {name; hp; ptype} -> hp
        ```
