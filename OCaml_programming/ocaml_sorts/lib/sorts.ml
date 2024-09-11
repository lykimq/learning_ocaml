module Sorts : sig
  val bubble_sort : 'a list -> 'a list
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
end
