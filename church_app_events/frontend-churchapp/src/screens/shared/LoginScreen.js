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
      <View style={styles.container}>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: Platform.OS === 'web' ? 0 : 1,
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    width: Platform.OS === 'web' ? '90%' : '100%',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
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
    backgroundColor: '#4A90E2',  // Match the color scheme from EventsList
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
