import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import * as userService from '../../services/userService';

const LogoutScreen = ({ navigation }) => {
  const { setUser } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      console.log('LogoutScreen - Starting logout process');
      try {
        // Call the logout endpoint through userService
        await userService.logout();

        // Clear user data from context
        setUser(null);

      } catch (error) {
        console.error('LogoutScreen - Logout error:', error);
        // If there's an error, still try to navigate back and clear user data
        setUser(null);
        navigation.navigate('AuthNavigator');
      }
    };

    performLogout();
  }, [navigation, setUser]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.text}>Logging out...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default LogoutScreen;
