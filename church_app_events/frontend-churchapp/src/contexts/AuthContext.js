import React, {createContext, useContext, useState} from 'react';

const AuthContext = createContext ();

export function AuthProvider({children}) {
  const [isAdmin, setIsAdmin] = useState (false);

  const loginAsAdmin = () => setIsAdmin (true);
  const logout = () => setIsAdmin (false);

  return (
    <AuthContext.Provider value={{isAdmin, loginAsAdmin, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth () {
  return useContext (AuthContext);
}
