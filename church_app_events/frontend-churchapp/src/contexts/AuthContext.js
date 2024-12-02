import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyPassword } from '../services/userService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const login = async (loginData) => {
    try {
      const userData = await verifyPassword(loginData);
      console.log('AuthContext - Login successful:', userData); // Debug log

      setUser(userData);
      setIsAdmin(userData.role === 'admin');
      return userData;
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Check if user is already logged in on app start
  const checkAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem('auth_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
