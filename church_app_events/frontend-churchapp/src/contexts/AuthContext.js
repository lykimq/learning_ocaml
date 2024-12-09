import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as userService from '../services/userService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      console.log('AuthContext - Logout initiated');
      // Clear any stored tokens or user data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Clear the user state
      setUser(null);
      console.log('AuthContext - Logout successful');
      return true;
    } catch (error) {
      console.error('AuthContext - Logout error:', error);
      throw error;
    }
  };

  const getCurrentUser = () => user;

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      login,
      logout,
      getCurrentUser,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
