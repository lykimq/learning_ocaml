module Sorts : sig
  val bubble_sort : 'a list -> 'a list
  val insert_sort : 'a list -> 'a list
  val quick_sort : 'a list -> 'a list
  val merge_sort : 'a list -> 'a list
end = struct
  (* Performs one pass of bublle sort *)
  let bubble_pass lst =
    let rec pass acc = function
      | [] -> List.rev acc
      | [ x ] -> List.rev (x :: acc)
      | x1 :: x2 :: tl ->
          if x1 > x2 then (* swap x1 and x2 *)
            pass (x1 :: acc) (x2 :: tl)
          else pass (x2 :: acc) (x1 :: tl)
    in
    pass [] lst

  (* Bubble sort is a simple sorting algorithm that repeatedly steps through the
     list, compares adjacent elements, and swaps them if they are in the wrong
     order. The process is repeated until the list is sorted *)
  let bubble_sort lst =
    let rec sort lst is_sorted =
      if is_sorted then lst
      else
        let sorted = bubble_pass lst in
        (* Check if already sorted *)
        sort sorted (sorted = lst)
    in
    sort lst false

  (* Insertion sort is a simple, comparision-based sorting algorithm that builds
     the sorted array one element at a time. It works by picking an element from
     the unsorted portion of the list and inserting it into the correct position
     in the sorted portion. *)

  (* Insert element x into a sorted list in the correct position *)
  let rec insert x sorted =
    match sorted with
    | [] -> [ x ]
    | hd :: tl -> if x <= hd then x :: sorted else hd :: insert x tl

  let insert_sort lst =
    let rec aux acc = function
      | [] -> List.rev acc
      | hd :: tl -> aux (insert hd acc) tl
    in
    aux [] lst

  (* Quick-sort is a divide-and-conquer algorithm that selects a pivot element
     from the array and partitions the other elements into two sub-arrays:
     - those less than or equal to the pivot, and
     - those greater than the pivot. It is then recursively applies the same
       logic to the sub-arrays until the base case of an empty or single-element
       array is reached. *)

  let partition_pivot pivot lst =
    List.fold_right
      (fun x (left, right) ->
        if x <= pivot then (x :: left, right) else (left, x :: right))
      lst ([], [])

  let quick_sort lst =
    let rec aux acc = function
      | [] -> acc
      | pivot :: rest ->
          let left, right = partition_pivot pivot rest in
          aux (pivot :: aux acc right) left
    in
    aux [] lst

  (* Merge sort is a divide-and-conquer algorithm that splits
     the list into halves. Recursively sorts each half, and then
     merges the two halves together in sorted order. *)

  let rec merge left right acc =
    match (left, right) with
    | [], ys -> List.rev_append acc ys
    | xs, [] -> List.rev_append acc xs
    | x :: xs, y :: ys ->
        if x <= y then merge xs right (x :: acc) else merge left ys (y :: acc)

  let rec split lst acc1 acc2 toggle =
    match lst with
    | [] -> (List.rev acc1, List.rev acc2)
    | x :: xs ->
        if toggle then
          (* If toggle is true, add the current element 'x' to acc1,
             and continue recursively with the rest of the list 'xs'.
             Toggle is set to false for the next recursion so that the next
             element goes to acc2. *)
          split xs (x :: acc1) acc2 (not toggle)
        else
          (* If toggle is false, add the current element 'x' to acc2,
             and continue recursively with the rest of the list 'xs'.
             Toggle is set to true for the next recursion so that the next
             element goes to acc1. *)
          split xs acc1 (x :: acc2) (not toggle)

  let rec merge_sort lst =
    match lst with
    | [] | [ _ ] -> lst
    | _ ->
        let left, right = split lst [] [] true in
        let sorted_left = merge_sort left in
        let sorted_right = merge_sort right in
        merge sorted_left sorted_right []
end
