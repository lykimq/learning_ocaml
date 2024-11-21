import React, {useState} from 'react';
import {View, TextInput, Button, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../contexts/AuthContext';

export default function LoginScreen({route}) {
  const navigation = useNavigation ();
  const {loginAsAdmin, logout} = useAuth ();

  const [username, setUsername] = useState ('');
  const [password, setPassword] = useState ('');
  const [errorMessage, setErrorMessage] = useState ('');

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
      loginAsAdmin ();
      navigation.navigate ('AdminNavigator');
    } else {
      setErrorMessage ('Invalid username or password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Username input */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      {/* Password input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Error message */}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {/* Login button */}
      <Button title="Login" onPress={handleLogin} />

    </View>
  );
}

const styles = StyleSheet.create ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  error: {
    color: 'red',
    marginVertical: 8,
  },
});
