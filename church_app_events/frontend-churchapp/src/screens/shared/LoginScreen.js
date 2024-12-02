import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [loginType, setLoginType] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = `${loginType === 'email' ? 'Email' : 'Username'} is required`;
    } else if (loginType === 'email' && !validateEmail(identifier.trim())) {
      newErrors.identifier = 'Invalid email format';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const loginData = {
        identifier: identifier.trim(),
        password: password.trim()
      };

      const userData = await login(loginData);
      console.log('Login successful, user data:', userData);

      if (userData) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: userData.role === 'admin' ? 'AdminNavigator' : 'UserNavigator'
            }
          ]
        });
        console.log('Navigation reset to:', userData.role === 'admin' ? 'AdminNavigator' : 'UserNavigator');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'Invalid credentials'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Login</Text>

        <View style={styles.inputContainer}>
          <SegmentedButtons
            value={loginType}
            onValueChange={setLoginType}
            buttons={[
              { value: 'email', label: 'Email' },
              { value: 'username', label: 'Username' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label={loginType === 'email' ? 'Email' : 'Username'}
            mode="outlined"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              setErrors({ ...errors, identifier: '', general: '' });
            }}
            style={styles.input}
            keyboardType={loginType === 'email' ? 'email-address' : 'default'}
            autoCapitalize="none"
            error={!!errors.identifier}
            disabled={loading}
          />
          {errors.identifier && (
            <HelperText type="error" visible={true}>
              {errors.identifier}
            </HelperText>
          )}

          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: '', general: '' });
            }}
            style={styles.input}
            secureTextEntry={!showPassword}
            error={!!errors.password}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
                forceTextInputFocus={false}
              />
            }
          />
          {errors.password && (
            <HelperText type="error" visible={true}>
              {errors.password}
            </HelperText>
          )}

          {errors.general && (
            <Text style={styles.error}>{errors.general}</Text>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
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
    marginTop: Platform.OS === 'web' ? 100 : 50,
  },
  inputContainer: {
    width: '100%',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  error: {
    color: '#e41e3f',
    marginVertical: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
    backgroundColor: '#4A90E2',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
});
