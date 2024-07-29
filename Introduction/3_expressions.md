# Chapter 3: Expressions

## Expressions and values

Think of expressions as questions. For example, "What is 2 plus 2?" or what happens if I add 1 to 21?" When you ask these questions, you get the answers. The answer itself, like the number 4 or 22, is what we call a value. So, expressions are like questions, and values are the answers!

## Basic types of values

In OCaml, there are a few simple types of values:
- Numbers: Like 1, 2, 3, or 3.14. These can be whole numbers (integers) or decimal numbers (floats).
- True/False: This is like asking if something is correct or not. In OCaml, it is written as `true` or `false`.
- Characters: Single letters like `a` or `b`.
- Words: These are strings of characters, like "hello" or "world".

## Doing basic math

You can do math with these values:
- Integers: 5 + 3 gives you 8. You can also do things like 10 - 2 or 6 * 4.
- Floats: for decimal numbers, you use `*.` so `3.14 *. 2` gives you 6.28.

But remember, you can't mix these types without converting them first. You have to use special functions to change between whole numbers and decimal numbers.

## Comparing values

You can compare values to check if they are the same or different:
- Same. use `=`
- Different? use `<>`

For exaùple, you check if 5 is the same as 5 using `5 = 5`.

## Checking conditions

You can make decisions with if-then-else:
- **If** something is true, **then** do one thing.
- **Else** do something else.

For example, if 2 + 2 is greater than 3, then say "Yes" otherwise say "No".

## Making blocks of code

In OCaml, you can create small blocks of code using `let`. This is like making a list of instructions:
- `let x = 10` means "Let's call this number 10 and name it x".
- `in x + 2` mean "Now, use x in this next step."

So, if you say `let x = 10 in x + 2`, you are telling the computer to use 10 as x and then add 2 to it.

## Variable names

You can use the same name for different things in different places, but it is like making new names each time. If you call something `x` in one place, and `x` again in another place, it is like having different x's that don't affect each other.

## Type checking

Sometimes you want to make sure that somehting is the right type. For example, you can check that a number is really a number and not some other type of value.

So, in short, you are asking questions (expressions) to get answers (values), doing basic math, making decisions, and organizing your code in blocks. You also make sure your code is working with the right types of values.
