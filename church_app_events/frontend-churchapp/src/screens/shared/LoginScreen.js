import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { TextInput, Button, Text } from 'react-native-paper';

export default function LoginScreen({ route }) {
  const navigation = useNavigation();
  const { loginAsAdmin, logout } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const adminCredentials = {
    username: 'admin',
    password: 'admin',
    role: 'admin',
  };

  const handleLogin = () => {
    if (
      username === adminCredentials.username &&
      password === adminCredentials.password
    ) {
      loginAsAdmin();
      navigation.navigate('AdminNavigator');
    } else {
      setErrorMessage('Invalid username or password');
    }
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Login</Text>

        <View style={styles.inputContainer}>
          <TextInput
            label="Username"
            mode="outlined"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />

          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Login
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  contentContainer: {
    padding: 20,
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    width: '100%',
    alignSelf: 'center',
    marginTop: Platform.OS === 'web' ? 100 : 50, // Add some top margin
  },
  inputContainer: {
    width: '100%',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  error: {
    color: '#e41e3f',
    marginVertical: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#4A90E2',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
