module AVL_Tree : sig
  type 'a avl_tree =
    | Empty
    | Node of {
        value : 'a;
        left : 'a avl_tree;
        right : 'a avl_tree;
        height : int;
      }

  val empty : 'a avl_tree
  val height : 'a avl_tree -> int
  val print_tree : int avl_tree -> string
  val make_node : 'a -> 'a avl_tree -> 'a avl_tree -> 'a avl_tree
  val rotate_right : 'a avl_tree -> 'a avl_tree
  val rotate_left : 'a avl_tree -> 'a avl_tree
  val rotate_left_right : 'a avl_tree -> 'a avl_tree
  val rotate_right_left : 'a avl_tree -> 'a avl_tree
  val insert : 'a -> 'a avl_tree -> 'a avl_tree
  val delete : 'a -> 'a avl_tree -> 'a avl_tree
  val search : 'a -> 'a avl_tree -> bool
end
