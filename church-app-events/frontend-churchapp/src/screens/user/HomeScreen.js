import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';

// Dashboard of user screen
const HomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to Church App</Text>
      <Text style={styles.subtitle}>What would you like to do today?</Text>
      <Button
        title="View Events"
        onPress={() => navigation.navigate ('EventScreen')}
      />
      <Button
        title="Join Home Group"
        onPress={() => navigation.navigate ('HomeGroupScreen')}
      />
      <Button
        title="Explore Media"
        onPress={() => navigation.navigate ('MediaScreen')}
      />
      <Button
        title="Serving Opportunities"
        onPress={() => navigation.navigate ('ServingScreen')}
      />
    </View>
  );
};

const styles = StyleSheet.create ({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
});

export default HomeScreen;
