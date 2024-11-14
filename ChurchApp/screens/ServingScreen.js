import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function ServingScreen () {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>serving</Text>
      <Text style={styles.title}>
        List of church servings will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
