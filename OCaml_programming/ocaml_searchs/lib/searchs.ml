module Searchs : sig
  val linear_search : 'a list -> 'a -> bool
  val binary_search : 'a list -> 'a -> bool
  val jump_search : 'a list -> 'a -> bool
  val exponential_search : 'a list -> 'a -> bool
  val interpolation_search : int list -> int -> bool
  val fibonacci_search : 'a list -> 'a -> bool
end = struct
  (** Linear search: checks each element sequentially until the target is found. *)
  let linear_search lst target = List.exists (fun x -> x = target) lst

  (** Binary search: works on sorted lists by repeatedly halving the search
      range. *)
  let binary_search lst target =
    let rec aux left right =
      if left > right then false
      else
        let mid = (left + right) / 2 in
        let mid_val = List.nth lst mid in
        if mid_val = target then true
        else if mid_val > target then aux left (mid - 1)
        else (* Search on the right part *)
          aux (mid + 1) right
    in
    aux 0 (List.length lst - 1)

  (** Jump search: makes jumps of size sqrt(n) until the block containing the
      target is found, then performs linear search within that block. *)
  let jump_search lst target =
    let n = List.length lst in
    (* For example, with n = 100, we will jump in blocks of 10 elements. *)
    let step = int_of_float (sqrt (float_of_int n)) in
    let rec search start =
      if start >= n then false
      else if List.nth lst start = target then true
      else if
        (* the target is in the previous block. *)
        List.nth lst start > target
      then
        linear_search
          (List.filteri
             (fun i _ ->
               (* [start - step + 1]: substract from start to step, +1 ensures
                    that we don't include the element that is at the [start -
                    step], because this element was already checked when we made
                    the previous jump.

                    [i < start]: ensure that we stop checking just before the
                  [start] index. *)
               i >= start - step + 1 && i < start)
             lst)
          target
      else search (start + step)
    in
    search step

  (** Exponential search: grows the range exponentially to find where the target
      is, then performs binary search within that range. *)
  let list_sub lst start len =
    let rec aux lst start len acc =
      match (lst, start) with
      | _, _ when len <= 0 -> List.rev acc
      | [], _ -> List.rev acc
      | _x :: xs, 0 ->
          (* when start is 0, start addding elements to the acc *)
          aux xs 0 (len - 1) (List.hd lst :: acc)
      | _ :: xs, n ->
          (* skip elements until we reach the starting index *)
          aux xs (n - 1) len acc
    in
    aux lst start len []

  let exponential_search lst target =
    let n = List.length lst in
    (* If the first element is the target, true *)
    if List.nth lst 0 = target then true
    else
      (* Find the range where the target might be located. The range grows
         exponetially, doubling the bound at each step. *)
      let rec find_range bound =
        if bound < n && List.nth lst bound <= target then find_range (bound * 2)
        else
          let left = bound / 2 in
          let right = min (bound - 1) (n - 1) in
          binary_search (list_sub lst left (right - left + 1)) target
      in
      find_range 1

  (*** Interpolation search: estimates the position of the target by considering
       its value relative to the list's range. Works best with uniformly
       distributed values.
       Ex: [10; 20; 30; 40; 50; 60; 70; 80; 90]
       - low = 0
       - high = 8
       - target = 65
       - diff_target_low = 65 - 10 = 55
       - index_range = 0 - 8 = 8
       - diff_target_high = 90 - 10 = 80
       - proportional_pos = 55 * 8 / 80 = 5
       - pos = 0 + 5 = 5

           The estimated position is 5, meaning we expect the target to be
           around index 5 in the list.
  *)
  let interpolation_search lst target =
    let n = List.length lst in
    let rec aux low high =
      if
        low <= high && target >= List.nth lst low && target <= List.nth lst high
      then
        let low_val = List.nth lst low in
        let high_val = List.nth lst high in
        let diff_target_low = target - low_val in
        let diff_range = high_val - low_val in
        if diff_range = 0 then low_val = target
        else
          let pos = low + (diff_target_low * (high - low) / diff_range) in
          let pos = min (max low pos) high in
          if List.nth lst pos = target then true
          else if List.nth lst pos < target then aux (pos + 1) high
          else aux low (pos - 1)
      else false
    in
    aux 0 (n - 1)

  (** Fibonacci search uses Fibonacci numbers to divide the list into smaller
        sections. It performs well on sorted lists.

      The Fibonacci sequence is defined as a series of numbers where each number
      is the sum of the two preceding ones, starting from 0 to 1.

      - offset: the starting index for the current section of the list.
      - fib_m: the current largest Fib number used for splitting.
      - fib_m1: the second largest Fib number (used for controlling next division).
      - fib_m2: the thirst largest Fib number (helps determine the next index to check)
             Ex
        [10; 22; 35; 40; 45; 50; 80; 82; 85; 90; 100]
      - target: 85
      - length lst: n = 11
      - fib numbers up to n = 11 are:
        f(0) = 0; f(1) = 1; f(2) = f(1)+f(0) = 1;
        f(3) = f(2) + f(1) = 1 + 1 = 2; ... ;
        f(7) = f(6) + f(5) = 8 + 5 = 13

        sequence: (0; 1; 1; 2; 3; 5; 8; 13)

      - fb_m = 8 (the highest Fib number < n )
      - fb_m1 = 5 (The Fib number before 8)
      - fb_m2 = 3 (The Fib number before 5)

        Step 2: search
      - offset = 0
      - idx = min(offset + fib_m2, n - 1)= min(0 + 3, 10) = 3
        List.nth 3 lst = 40
        40 < 85, the target must be on the right of the index [3]

      - Move the search range to the right by updating:
        + offset = offset + fib_m2 = 0 + 3 = 3
        + update fib numbers:
        ++ fib_m = fib_m - fib_m1 = 8 - 5 = 3
        ++ fib_m1 = 5
        ++ fib_m2 = fib_m1 - fib_m2 = 5 - 3 = 2
        etc.
  *)

  let fibonacci_search lst target =
    let n = List.length lst in
    (* Precompute Fib numbers until the largest one is smaller than [n] *)
    let rec fib_gen fibs =
      let f1 = List.hd fibs in
      let f2 = List.hd (List.tl fibs) in
      if f1 + f2 > n then fibs else fib_gen ((f1 + f2) :: fibs)
    in
    (* [1; 1] as initial list is that it corresponds to the first 2 Fib numbers.
       F(0) = 0; F(1) = 1; F(2) = F(1) + F(0) = 1 *)
    let fibs = fib_gen [ 1; 1 ] in
    let rec search offset fib_m fib_m1 fib_m2 =
      if fib_m < 1 then false
      else
        let idx = min (offset + fib_m2) (n - 1) in
        (* Using [List.nth_opt] avoid the program crashing on out-of-bound
           access, which can also be handled without using exception handling.
        *)
        match List.nth_opt lst idx with
        | None -> false
        | Some v ->
            if v = target then true
            else if v < target then
              (* Search in the right part of the list *)
              search (offset + fib_m2) (fib_m - fib_m1) fib_m1 fib_m2
            else
              (* Search in the left part of the list *)
              search offset fib_m1 fib_m2 (fib_m1 - fib_m2)
    in
    match fibs with
    | [] | [ _ ] -> false
    | fib_m :: fib_m1 :: fib_m2 :: _ -> search 0 fib_m fib_m1 fib_m2
    | _ -> false
end
