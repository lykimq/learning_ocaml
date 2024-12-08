import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CustomTabButton = ({ routeName, children }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName }],
    });
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});

export default CustomTabButton;