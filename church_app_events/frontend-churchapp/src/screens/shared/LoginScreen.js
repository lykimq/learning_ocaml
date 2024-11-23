import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen({ route }) {
  const navigation = useNavigation();
  const { loginAsAdmin, logout } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hardcoded credentials for admin only
  const adminCredentials = {
    username: 'admin',
    password: 'admin',
    role: 'admin',
  };

  // Handle login action
  const handleLogin = () => {
    if (
      username === adminCredentials.username &&
      password === adminCredentials.password
    ) {
      // Admin login successful, update the login state
      loginAsAdmin();
      navigation.navigate('AdminNavigator');
    } else {
      setErrorMessage('Invalid username or password');
    }
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Button title="Login" onPress={handleLogin} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: Platform.OS === 'web' ? 0 : 1,
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    width: Platform.OS === 'web' ? '90%' : '100%',
    padding: Platform.OS === 'web' ? 0 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? 'transparent' : '#fff',
  },
  inputContainer: {
    width: '100%',
    gap: 16,
    maxWidth: Platform.OS === 'web' ? 320 : '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    fontSize: 16,
    backgroundColor: Platform.OS === 'web' ? 'transparent' : '#fff',
  },
  error: {
    color: '#e41e3f',
    marginVertical: 8,
    textAlign: 'center',
  },
});
