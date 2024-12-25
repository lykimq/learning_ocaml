import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';
import * as userService from '../../services/userService';

export default function LoginScreen({ navigation }) {
  const { setUser } = useAuth();

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
    console.log('Login button pressed');
    if (!validateForm()) {
      console.log('Form validation failed', errors);
      return;
    }

    setLoading(true);
    try {
      const loginData = {
        identifier: identifier.trim(),
        password: password.trim()
      };
      console.log('Attempting login with:', loginData);

      const response = await userService.login(loginData);
      console.log('Login successful:', response);

      const { user, token } = response;

      setUser(user);

    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'Invalid credentials'
      });
    } finally {
      setLoading(false);
    }
  };

  const onButtonPress = () => {
    console.log('Button pressed!');
    handleLogin();
  };

  useEffect(() => {
    navigation.addListener('beforeRemove', (e) => {
      if (loading) {
        e.preventDefault();
      }
    });
    console.log('LoginScreen mounted');
  }, [navigation, loading]);

  return (
    <View style={[styles.pageContainer, { flex: 1 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Login</Text>
      </View>

      <View style={[styles.contentContainer, { flex: 1 }]}>
        <View style={styles.inputContainer}>
          <SegmentedButtons
            value={loginType}
            onValueChange={setLoginType}
            buttons={[
              {
                value: 'email',
                label: 'Email',
                labelStyle: { color: loginType === 'email' ? '#fff' : '#000' }
              },
              {
                value: 'username',
                label: 'Username',
                labelStyle: { color: loginType === 'username' ? '#fff' : '#000' }
              },
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
                color={errors.password ? 'red' : 'black'}
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
            onPress={onButtonPress}
            style={[
              styles.button,
              { elevation: 3 }
            ]}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            <Text>{loading ? 'Logging in...' : 'Login'}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    width: '100%',
    alignSelf: 'center',
    marginTop: Platform.OS === 'web' ? 50 : 20,
  },
  inputContainer: {
    width: '100%',
    gap: 8,
    zIndex: 1,
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
    zIndex: 1000,
    minHeight: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
});
