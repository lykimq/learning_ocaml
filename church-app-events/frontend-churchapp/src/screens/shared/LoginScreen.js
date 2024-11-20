import React, {useState} from 'react';
import {View, TextInput, Button, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import UserNavigator from '../../navigation/UserNavigator';
import AdminNavigator from '../../navigation/AdminNavigator';
import DashboardScreen from '../admin/DashboardScreen';

export default function LoginScreen () {
  const navigation = useNavigation ();

  // State to manage the inputs
  const [username, setUsername] = useState ('');
  const [password, setPassword] = useState ('');
  const [errorMessage, setErrorMessage] = useState ('');

  // Hardcoded credentials for admin and user
  const userCredentials = {
    username: 'user',
    password: 'user',
    role: 'user',
  };

  const adminCredentials = {
    username: 'admin',
    password: 'admin',
    role: 'admin',
  };

  // Handle login action
  const handleLogin = () => {
    if (
      username === userCredentials.username &&
      password === userCredentials.password
    ) {
      // Navigate to User screen
      navigation.navigate ('UserNavigator');
    } else if (
      username === adminCredentials.username &&
      password === adminCredentials.password
    ) {
      // Navigate to Admin screen
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
