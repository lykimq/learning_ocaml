import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { CommonActions } from '@react-navigation/native';
import * as userService from '../../services/userService';

const LogoutScreen = ({ navigation }) => {
  const { setUser } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      console.log('LogoutScreen - Starting logout process');
      try {
        // Call the logout endpoint through userService
        await userService.logout();
        console.log('LogoutScreen - Logout API call successful');

        // Clear user data from context
        setUser(null);

        // Clear any stored tokens or user data
        // If you're using AsyncStorage:
        // await AsyncStorage.removeItem('token');

        console.log('LogoutScreen - User context cleared');

        // Reset navigation and go to LoginScreen
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
          })
        );
        console.log('LogoutScreen - Navigation reset completed');
      } catch (error) {
        console.error('LogoutScreen - Logout error:', error);
        // If there's an error, still try to navigate back and clear user data
        setUser(null);
        navigation.navigate('LoginScreen');
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
