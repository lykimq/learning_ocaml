import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as userService from '../services/userService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const isAdmin = user?.role === 'admin';

  const login = async (loginData) => {
    try {
      const response = await userService.login(loginData);
      const { user, token } = response;

      // Store the token
      await AsyncStorage.setItem('token', token);

      // Set the user in state
      setUser(user);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await userService.logout();
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      login,
      logout,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
