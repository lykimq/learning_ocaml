import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function GivingScreen () {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giving</Text>
      <Text style={styles.title}>Giving form will appear here.</Text>
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
