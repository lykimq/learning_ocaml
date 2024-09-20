module Searchs : sig
  val linear_search : 'a list -> 'a -> bool
  val binary_search : 'a list -> 'a -> bool
  val jump_search : 'a list -> 'a -> bool
  val exponential_search : 'a list -> 'a -> bool
  val interpolation_search : int list -> int -> bool
  val fibonacci_search : 'a list -> 'a -> bool
end
