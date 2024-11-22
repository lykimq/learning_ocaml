import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LogoutScreen = ({ navigation }) => {
  const { logout } = useAuth();

  // Handle logout and navigate to UserNavigator
  React.useEffect(() => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'UserNavigator' }], // Reset navigation to UserNavigator
    });
  }, [logout, navigation]);

  return null; // No UI, just perform the logout action
};

export default LogoutScreen;
