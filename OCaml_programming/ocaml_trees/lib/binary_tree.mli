(** A module for a simple binary tree structure *)

module BinaryTree : sig
  (** The type representing a binary tree. *)
  type 'a tree

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
end
