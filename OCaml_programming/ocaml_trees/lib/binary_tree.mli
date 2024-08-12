(** A module for a simple binary tree structure *)

module Binary_Tree : sig
  type 'a tree
  (** The type representing a binary tree. *)

  (** An empty tree *)

  val empty : 'a tree

  (** [insert x tree] inserts the value [x] into the binary tree [tree].
  If [x] is already exits in the tree, the tree remain unchanged. *)

  val insert : 'a -> 'a tree -> 'a tree

  val search : 'a -> 'a tree -> bool
  (** [search x tree] returns [true] if the value [x] exits in the binary tree [tree],
    and [false] otherwise. *)

  (** [inorder tree] returns a list of all the elements in the binary tree [tree]
in in-order traversal order (left, root, right). *)

  val inorder : 'a tree -> 'a list

  (** [preorder tree] returns a list of all the elements in the binary tree [tree]
in in-order traversal order (root, left, right). *)

  val preorder : 'a tree -> 'a list

  (** [postorder tree] returns a list of all the elements in the binary tree [tree]
in in-order traversal order (left, right, root). *)

  val postorder : 'a tree -> 'a list

  (** [print_tree tree] helper function to print tree. *)

  val print_tree : int tree -> unit
end
