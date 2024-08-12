module AVL_Tree : sig
  type 'a avl_tree

  val empty : 'a avl_tree

  val build_node :
    value:'a ->
    left:'a avl_tree ->
    right:'a avl_tree ->
    height:int ->
    'a avl_tree

  val print_tree : int avl_tree -> string
  val right_rotate : 'a avl_tree -> 'a avl_tree
end
