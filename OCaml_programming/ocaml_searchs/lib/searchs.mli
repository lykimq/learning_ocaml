module Searchs : sig
  val linear_search : 'a list -> 'a -> bool
  val binary_search : 'a list -> 'a -> bool
  val jump_search : 'a list -> 'a -> bool
  val exponential_search : 'a list -> 'a -> bool

  val interpolation_search :
    compare:('a -> 'a -> int) -> to_int:('a -> int) -> 'a list -> 'a -> bool

  val fibonacci_search : 'a list -> 'a -> bool
end
