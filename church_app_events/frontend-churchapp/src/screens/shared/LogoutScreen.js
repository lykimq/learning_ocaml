import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

const LogoutScreen = ({ navigation }) => {
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        // Navigate to LoginScreen
        navigation.reset({
          index: 0,
          routes: [{ name: 'UserNavigator' }],
        });
      } catch (error) {
        console.error('Logout error:', error);
        navigation.goBack();
      }
    };

    performLogout();
  }, [logout, navigation]);

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
