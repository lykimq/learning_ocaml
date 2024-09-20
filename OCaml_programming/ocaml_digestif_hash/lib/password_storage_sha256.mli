module PasswordStorage : sig
  val hash_password : string -> string
  val verify_password : string -> string -> bool
end
